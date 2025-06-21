import pandas as pd
import geopandas as gpd
import numpy as np
from shapely.geometry import Point, Polygon, box
import folium
import itertools
from pathlib import Path
import json # GeoJSON処理用
import jismesh.utils as ju # ★ jismesh.utils を ju としてインポート
import math # ★ math をインポート (ステップ計算用)

# --- 0. 設定値 ---
# CRS設定
TARGET_CRS_GEOGRAPHIC = "EPSG:4326"  # WGS84 (緯度経度)
TARGET_CRS_PROJECTED = "EPSG:6677" # JGD2011 / Japan Plane Rectangular CS IX (関東地方向け)
                                    # 分析エリアに合わせて適切な投影座標系を選択してください

# --- 人口データ設定 ---
POP_MESH_LEVEL = "250m" # 使用するメッシュレベル ('250m' or '1000m')
# POP_MESH_LEVEL = "1000m" # 1kmメッシュを使う場合はこちらを有効化

if POP_MESH_LEVEL == "250m":
    POP_DATA_DIR = Path("./estat/250mesh")
    POP_VALUE_COL = 'T001142001' # 250mメッシュの人口総数カラム名
elif POP_MESH_LEVEL == "1000m":
    POP_DATA_DIR = Path("./estat/1000mesh")
    POP_VALUE_COL = 'T001140001' # 1kmメッシュの人口総数カラム名
else:
    raise ValueError("POP_MESH_LEVEL must be '250m' or '1000m'")

POP_MESH_COL = 'KEY_CODE'   # メッシュコードが含まれる列名
POP_CSV_ENCODING = 'cp932' # テキストファイルのエンコーディング (Shift-JISなど)
CSV_HEADER_ROW = 0         # ヘッダー行のインデックス (0始まり)

# ハフモデルパラメータ
DEFAULT_ATTRACTIVENESS = 1.0
DISTANCE_DECAY = 1.5
MAX_DISTANCE_M = 3000 # メートル

# シミュレーション設定
N_NEW_STORES_GREEDY = 5
MIN_DEMAND_PER_STORE = 0

# === ダミーデータ生成用パラメータ (実際のデータ利用時はコメントアウトまたは削除推奨) ===
N_CANDIDATES = 100                                # ダミー候補地数
N_EXISTING_SELF = 2                               # ダミー自店舗数
N_EXISTING_COMP = 3                               # ダミー競合店舗数
# =================================================================================

# --- ヘルパー関数: メッシュレベル取得とステップ計算 ---
# ▼▼▼ 以下の get_mesh_level と get_mesh_steps は jismesh.utils を使うため不要になります ▼▼▼
# def get_mesh_level(mesh_code_str):
#     """メッシュコード文字列からメッシュレベルを判定"""
#     length = len(mesh_code_str)
#     if length == 4: return 1
#     if length == 6: return 2
#     if length == 8: return 3
#     if length == 9: return 4 # 1/2 mesh
#     if length == 10: return 5 # 1/4 mesh (250m)
#     if length == 11: return 6 # 1/8 mesh
#     raise ValueError(f"Invalid mesh code length ({length}) for: {mesh_code_str}")

# def get_mesh_steps(level):
#     """メッシュレベルから緯度経度のステップ幅を計算"""
#     if level == 1: return (2/3), 1.0
#     lat_step, lon_step = (2/3), 1.0
#     for lv in range(2, level + 1):
#         if lv % 2 == 0: # 偶数レベル (縦横2分割)
#             lat_step /= 2
#             lon_step /= 2
#         else: # 奇数レベル (縦横交互分割、ただしレベル3以降)
#              if lv == 3:
#                  lat_step /= 10 # 実際は8分割
#                  lon_step /= 10 # 実際は10分割だが、簡単化のため
#              elif lv == 5: # 250m mesh: レベル3を縦横2*2分割
#                  lat_step /= 2
#                  lon_step /= 2
#              elif lv == 7: # Not standard? Assume 2x2 split
#                  lat_step /= 2
#                  lon_step /= 2
#              # Note: 正確な定義は複雑。ここでは近似値を使う。
#              # レベル3: lat 1/120 deg, lon 1/80 deg
#              # レベル5: lat 1/960 deg, lon 1/640 deg
#              if level == 3: return 1/120, 1/80
#              if level == 5: return 1/960, 1/640
#              # Fallback for other levels based on simple division (less accurate)
#              scale = 8 * (10**((level-3)//2)) * (2**((level-3)%2))
#              if level > 1 :
#                  lat_step = (2/3) / scale
#                  lon_step = 1.0 / scale
#                  return lat_step, lon_step

#     raise ValueError(f"Could not determine steps for level: {level}")
# ▲▲▲ 上記の get_mesh_level と get_mesh_steps は jismesh.utils を使うため不要になります ▲▲▲


# --- 1. データ読み込み・準備 ---
def load_and_prepare_data(
    pop_data_dir,           # 人口データディレクトリのパス
    pop_mesh_col,           # メッシュコード列名
    pop_value_col,          # 人口値列名
    pop_csv_encoding,       # CSVエンコーディング
    csv_header_row,         # CSVヘッダー行インデックス
    n_candidates,           # (ダミー用) 候補地数
    n_existing_self,        # (ダミー用) 自店舗数
    n_existing_comp,        # (ダミー用) 競合店舗数
    initial_crs,            # 地理座標系CRS
    target_projected_crs    # 投影座標系CRS
    ):
    """
    指定されたディレクトリからメッシュ人口データを読み込み、
    jismesh.utils.to_meshpoint を使ってジオメトリを生成し、
    ダミーの候補地/既存店データと合わせて準備する。
    """
    # 1.1 需要メッシュ (指定ディレクトリ内の全.txtファイルから読み込み)
    all_pop_df = []
    print(f"Loading population data from text files in {pop_data_dir}...")
    if not pop_data_dir.is_dir():
        raise FileNotFoundError(f"Population data directory not found: {pop_data_dir}")

    txt_files = list(pop_data_dir.glob('*.txt'))
    if not txt_files:
        raise FileNotFoundError(f"No .txt files found in {pop_data_dir}")

    dtype_warning_cols = [4, 5, 6, 37, 38]
    dtype_spec = {col_idx: str for col_idx in dtype_warning_cols}
    dtype_spec[pop_mesh_col] = str

    for txt_file in txt_files:
        try:
            df = pd.read_csv(txt_file, encoding=pop_csv_encoding, header=csv_header_row,
                             dtype={pop_mesh_col: str},
                             low_memory=False)

            if pop_mesh_col in df.columns and pop_value_col in df.columns:
                df[pop_value_col] = pd.to_numeric(df[pop_value_col], errors='coerce').fillna(0)
                df_filtered = df[df[pop_value_col] > 0].copy()
                all_pop_df.append(df_filtered[[pop_mesh_col, pop_value_col]])
                print(f"  Loaded {len(df_filtered)} rows (pop>0) from {txt_file.name}")
            else:
                print(f"  Warning: Required columns ('{pop_mesh_col}', '{pop_value_col}') not found in {txt_file.name}. Skipping.")
        except Exception as e:
            print(f"  Error reading or processing {txt_file.name}: {e}")

    if not all_pop_df:
        raise ValueError("No population data could be loaded.")

    pop_df = pd.concat(all_pop_df, ignore_index=True)
    pop_df.rename(columns={pop_mesh_col: 'mesh_id', pop_value_col: 'population'}, inplace=True)
    pop_df = pop_df.drop_duplicates(subset=['mesh_id'])

    # jismesh を使ってメッシュコードからポリゴンリストを生成
    print("Generating geometries from mesh codes using jismesh.utils.to_meshpoint...")
    geometries = []
    valid_mesh_ids = []
    processed_mesh_codes = set()

    for mesh_code in pop_df['mesh_id']:
        if mesh_code in processed_mesh_codes:
            continue
        processed_mesh_codes.add(mesh_code)

        try:
            # ★★★ 修正点: jismesh.utils.to_meshpoint で南西端と北東端を取得 ★★★
            lat_sw, lon_sw = ju.to_meshpoint(str(mesh_code), 0, 0) # 南西端の緯度経度
            lat_ne, lon_ne = ju.to_meshpoint(str(mesh_code), 1, 1) # 北東端の緯度経度

            if lat_sw is None or lon_sw is None or lat_ne is None or lon_ne is None:
                print(f"  Warning: Could not get valid points for mesh code '{mesh_code}'. Skipping.")
                continue

            # ステップ幅を計算
            # lat_step = lat_ne - lat_sw # 本来はこちらだが、メッシュの定義上、マイナスになる場合があるため絶対値を取る
            # lon_step = lon_ne - lon_sw
            # JGD2011の緯度経度であれば lat_ne > lat_sw, lon_ne > lon_sw となるはず
            # より安全には、jismeshライブラリの仕様を再確認するか、mesh levelから標準的な幅を取得する方が良い
            # ここでは単純な差分を使用し、box関数が minx, miny, maxx, maxy を期待するため、
            # to_meshpointの結果が常に 南西 < 北東 であることを前提とする。
            # to_meshpoint の仕様では、lat_multiplier, lon_multiplier が 0->南/西端, 1->北/東端に対応する

            min_lon, min_lat = lon_sw, lat_sw
            max_lon, max_lat = lon_ne, lat_ne
            
            polygon = box(min_lon, min_lat, max_lon, max_lat)
            geometries.append(polygon)
            valid_mesh_ids.append(mesh_code)
        except AttributeError: # ju.to_meshpoint が見つからないなど
             print("\n\nERROR: 'jismesh.utils.to_meshpoint' function call failed.")
             print("Please ensure 'jismesh' library is installed correctly and imported as 'ju'.")
             print("Refer to the 'jismesh' documentation for the correct usage.")
             raise # 実行停止
        except ValueError as e: # to_meshpoint内で不正なメッシュコードなど
            print(f"  Warning: Could not process mesh code '{mesh_code}' with jismesh.utils.to_meshpoint: {e}. Skipping.")
        except Exception as e: # その他の予期せぬエラー
             print(f"  Unexpected error processing mesh code '{mesh_code}': {e}. Skipping.")

    if not geometries:
        raise ValueError("Failed to generate any valid geometries from mesh codes.")

    # 有効なメッシュIDに対応する人口データのみを保持
    pop_df_valid = pop_df[pop_df['mesh_id'].isin(valid_mesh_ids)].copy()

    # GeoDataFrameに変換 (地理座標系)
    demand_mesh_gdf_geo = gpd.GeoDataFrame(
        pop_df_valid[['mesh_id', 'population']],
        geometry=geometries,
        crs=initial_crs
    )

    if demand_mesh_gdf_geo.empty:
         raise ValueError("Failed to create demand mesh GeoDataFrame after merging population data.")

    # 投影座標系に変換
    print(f"Converting demand mesh to projected CRS: {target_projected_crs}")
    demand_mesh_gdf = demand_mesh_gdf_geo.to_crs(target_projected_crs)
    # メッシュ中心点を投影座標系で計算
    demand_mesh_gdf['center_point'] = demand_mesh_gdf.geometry.centroid

    print(f"Prepared {len(demand_mesh_gdf)} demand meshes from directory {pop_data_dir}.")

    # === ここから下はダミーデータ生成 (変更なし) ===
    # ... (エリア境界取得、候補地生成、既存店生成) ...
    area_bounds_proj = demand_mesh_gdf.total_bounds # minx, miny, maxx, maxy (投影座標系)

    print("Generating dummy candidate locations...")
    candidate_x = np.random.uniform(area_bounds_proj[0], area_bounds_proj[2], n_candidates)
    candidate_y = np.random.uniform(area_bounds_proj[1], area_bounds_proj[3], n_candidates)
    candidates_gdf = gpd.GeoDataFrame(
        {'id': [f'cand_{i}' for i in range(n_candidates)]},
        geometry=[Point(x, y) for x, y in zip(candidate_x, candidate_y)],
        crs=target_projected_crs
    )

    print("Generating dummy existing stores...")
    existing_stores_list = []
    # 自チェーン
    ex_self_x = np.random.uniform(area_bounds_proj[0], area_bounds_proj[2], n_existing_self)
    ex_self_y = np.random.uniform(area_bounds_proj[1], area_bounds_proj[3], n_existing_self)
    for i in range(n_existing_self):
        existing_stores_list.append({
            'id': f'self_ex_{i}',
            'geometry': Point(ex_self_x[i], ex_self_y[i]),
            'type': 'self',
            'attractiveness': DEFAULT_ATTRACTIVENESS
        })
    # 競合チェーン
    ex_comp_x = np.random.uniform(area_bounds_proj[0], area_bounds_proj[2], n_existing_comp)
    ex_comp_y = np.random.uniform(area_bounds_proj[1], area_bounds_proj[3], n_existing_comp)
    for i in range(n_existing_comp):
        existing_stores_list.append({
            'id': f'comp_ex_{i}',
            'geometry': Point(ex_comp_x[i], ex_comp_y[i]),
            'type': 'comp',
            'attractiveness': DEFAULT_ATTRACTIVENESS
        })

    if existing_stores_list:
        existing_stores_gdf = gpd.GeoDataFrame(existing_stores_list, geometry='geometry', crs=target_projected_crs)
    else:
        existing_stores_gdf = gpd.GeoDataFrame(
             columns=['id', 'geometry', 'type', 'attractiveness'],
             geometry=[],
             crs=target_projected_crs
         )

    print(f"Generated {len(candidates_gdf)} dummy candidates, {len(existing_stores_gdf)} dummy existing stores.")

    print(f"  All data is now in projected CRS: {target_projected_crs}")
    return candidates_gdf, demand_mesh_gdf, existing_stores_gdf

# --- 2. コア計算関数 (変更なし) ---
def calculate_demand_capture(demand_mesh_gdf, all_stores_gdf, distance_decay, max_distance):
    """
    ハフモデルに基づき、各需要メッシュの需要が各店舗にどれだけ獲得されるかを計算する。
    入力GeoDataFramesは投影座標系であること、all_stores_gdf に 'store_id' 列が存在することを前提とする。
    """
    if all_stores_gdf.empty or demand_mesh_gdf.empty:
        return pd.DataFrame(columns=['mesh_id', 'store_id', 'captured_demand']), pd.DataFrame(columns=['store_id', 'total_demand'])

    # 既に投影座標系なので、CRS変換に関する警告は出ないはず
    # ... (関数の残りの部分は変更なし) ...
    capture_results = []
    mesh_centers = demand_mesh_gdf[['mesh_id', 'population', 'center_point']].copy()
    # all_stores_gdf は 'store_id' を持つ前提なので、 'id' ではなく 'store_id' を使用
    stores = all_stores_gdf[['store_id', 'geometry', 'attractiveness', 'type']].copy()
    # stores.rename(columns={'id': 'store_id'}, inplace=True) # このリネームは不要

    for idx, mesh in mesh_centers.iterrows():
        mesh_id = mesh['mesh_id']
        mesh_pop = mesh['population']
        mesh_point = mesh['center_point']

        # 1. メッシュ中心から各店舗までの距離を計算 (投影座標系なのでメートル単位)
        distances = stores.geometry.distance(mesh_point)

        # 2. 最大距離内で、距離 > 0 の店舗をフィルタリング
        nearby_stores = stores[ (distances <= max_distance) & (distances > 0) ].copy()
        nearby_stores['distance'] = distances[ (distances <= max_distance) & (distances > 0) ]

        if nearby_stores.empty:
            continue

        # 3. 各店舗の引力
        nearby_stores['attraction'] = nearby_stores['attractiveness'] / (nearby_stores['distance'] ** distance_decay)

        # 4. メッシュに対する全店舗の引力合計
        total_attraction = nearby_stores['attraction'].sum()

        if total_attraction <= 0:
             continue

        # 5. 各店舗の獲得割合と獲得需要量
        nearby_stores['capture_ratio'] = nearby_stores['attraction'] / total_attraction
        nearby_stores['captured_demand'] = mesh_pop * nearby_stores['capture_ratio']

        for store_idx, store_data in nearby_stores.iterrows():
            capture_results.append({
                'mesh_id': mesh_id,
                'store_id': store_data['store_id'], # store_id を使用
                'store_type': store_data['type'],
                'captured_demand': store_data['captured_demand'],
                'capture_ratio': store_data['capture_ratio']
            })

    if not capture_results:
        return pd.DataFrame(columns=['mesh_id', 'store_id', 'captured_demand']), pd.DataFrame(columns=['store_id', 'total_demand'])

    capture_df = pd.DataFrame(capture_results)
    store_total_demand = capture_df.groupby('store_id')['captured_demand'].sum().reset_index()
    store_total_demand.rename(columns={'captured_demand': 'total_demand'}, inplace=True)
    # all_stores_gdf から 'store_id' と 'type' を取得
    store_info = all_stores_gdf[['store_id', 'type']]
    store_total_demand = pd.merge(store_total_demand, store_info, on='store_id', how='left')

    return capture_df, store_total_demand

# --- 3. 最適化アルゴリズム (貪欲法 - 変更なし) ---
def greedy_new_store_selection(
    candidates_gdf, # 投影座標系, 'id' 列を持つ
    demand_mesh_gdf, # 投影座標系
    existing_stores_gdf, # 投影座標系, 'id' 列を持つ
    n_new_stores,
    distance_decay,
    max_distance,
    min_demand_per_store=0
    ):
    selected_candidates_gdf = gpd.GeoDataFrame(columns=candidates_gdf.columns, crs=candidates_gdf.crs)
    # current_stores_gdf は 'id' 列を持つように初期化
    current_stores_gdf = existing_stores_gdf.copy()
    remaining_candidates_gdf = candidates_gdf.copy()

    print(f"\nStarting Greedy Algorithm to select {n_new_stores} new stores...")

    for i in range(n_new_stores):
        best_candidate_id_val = None # 'id' 列の値
        best_total_self_demand = -1
        best_candidate_to_add_gdf = None # 'id' 列を持つGeoDataFrame

        if remaining_candidates_gdf.empty:
            print("No more candidates available.")
            break

        print(f"--- Selecting store {i+1}/{n_new_stores} ---")
        evaluated_count = 0

        # 現在の店舗セット (current_stores_gdf) での需要計算
        # calculate_demand_capture は 'store_id' を期待するのでリネームして渡す
        temp_current_stores_for_calc = current_stores_gdf.rename(columns={'id': 'store_id'})
        _, current_iteration_demand_df = calculate_demand_capture(
                demand_mesh_gdf, temp_current_stores_for_calc, distance_decay, max_distance
            )
        base_self_demand = 0
        # 空でないか、'type' 列が存在するかチェック
        if not current_iteration_demand_df.empty and 'type' in current_iteration_demand_df.columns:
             base_self_demand = current_iteration_demand_df[current_iteration_demand_df['type'] == 'self']['total_demand'].sum()


        for idx, candidate_series in remaining_candidates_gdf.iterrows():
            # 候補を1行のGeoDataFrameにする (crsを維持)
            # candidate_seriesは 'id' 列を持つ
            temp_one_candidate_gdf = gpd.GeoDataFrame([candidate_series.to_dict()], geometry='geometry', crs=remaining_candidates_gdf.crs)
            temp_one_candidate_gdf['type'] = 'self'
            temp_one_candidate_gdf['attractiveness'] = DEFAULT_ATTRACTIVENESS

            # 計算用に 'id' を 'store_id' にリネーム
            temp_one_candidate_for_calc_gdf = temp_one_candidate_gdf.rename(columns={'id': 'store_id'})

            # current_stores_gdf も計算用にリネーム (ループの最初で行ったものと同じ)
            # temp_current_stores_for_calc は上で定義済み

            # 一時的な全店舗リストを作成 (両方とも 'store_id' 列を持つ)
            temp_all_stores_for_calc_gdf = pd.concat(
                [temp_current_stores_for_calc, temp_one_candidate_for_calc_gdf],
                ignore_index=True
            )

            _, temp_store_total_demand_df = calculate_demand_capture(
                demand_mesh_gdf, temp_all_stores_for_calc_gdf, distance_decay, max_distance
            )

            candidate_demand = 0
            if not temp_store_total_demand_df.empty:
                # candidate_series['id'] で検索するために、temp_store_total_demand_df には 'store_id' がある
                cand_demand_series = temp_store_total_demand_df[temp_store_total_demand_df['store_id'] == candidate_series['id']]
                if not cand_demand_series.empty:
                    candidate_demand = cand_demand_series['total_demand'].iloc[0]

            if candidate_demand < min_demand_per_store:
                 continue

            current_total_self_demand = 0
            # 空でないか、'type' 列が存在するかチェック
            if not temp_store_total_demand_df.empty and 'type' in temp_store_total_demand_df.columns:
                current_total_self_demand = temp_store_total_demand_df[temp_store_total_demand_df['type'] == 'self']['total_demand'].sum()

            if current_total_self_demand > best_total_self_demand:
                best_total_self_demand = current_total_self_demand
                best_candidate_id_val = candidate_series['id']
                # best_candidate_to_add_gdf は 'id' 列を持つオリジナルの候補の形式で保存
                best_candidate_to_add_gdf = temp_one_candidate_gdf.copy() # id, geometry, type, attractiveness を持つ
            evaluated_count +=1

        if best_candidate_id_val is not None and best_candidate_to_add_gdf is not None:
            added_demand = best_total_self_demand - base_self_demand
            print(f"  Selected: {best_candidate_id_val} (Evaluated: {evaluated_count}). Added Self Demand: {added_demand:.2f}, New Total Self Demand: {best_total_self_demand:.2f}")

            selected_candidates_gdf = pd.concat([selected_candidates_gdf, best_candidate_to_add_gdf], ignore_index=True)
            # current_stores_gdf に追加する際も 'id' 列を持つ GeoDataFrame を concat
            current_stores_gdf = pd.concat([current_stores_gdf, best_candidate_to_add_gdf], ignore_index=True)
            remaining_candidates_gdf = remaining_candidates_gdf[remaining_candidates_gdf['id'] != best_candidate_id_val]
        else:
            print(f"  No suitable candidate found for store {i+1} satisfying constraints. Stopping.")
            break

    print(f"\nGreedy selection finished. Selected {len(selected_candidates_gdf)} stores.")
    # 最終的な需要計算 (current_stores_gdf は 'id' 列を持つ)
    # calculate_demand_capture に渡すために 'id' を 'store_id' にリネーム
    final_stores_for_calc_gdf = current_stores_gdf.rename(columns={'id':'store_id'})
    final_capture_df, final_store_demand_df = calculate_demand_capture(
        demand_mesh_gdf, final_stores_for_calc_gdf, distance_decay, max_distance
    )
    # selected_candidates_gdf は 'id' 列を持つ
    return selected_candidates_gdf, final_store_demand_df

# --- 4. 可視化関数 (変更なし) ---
def create_choropleth_map_folium(demand_mesh_gdf_projected, capture_df, stores_gdf_projected,
                                 selected_new_stores_gdf_projected=None, target_crs_geo="EPSG:4326"):
    """
    投影座標系のデータを入力とし、Folium表示用に地理座標系に変換して地図を作成。
    """
    if demand_mesh_gdf_projected.empty:
        print("Demand mesh data is empty. Cannot create map.")
        return None

    # 1. メッシュごとの自チェーン獲得割合を計算 (入力は投影座標系のまま)
    self_capture = capture_df[capture_df['store_type'] == 'self']
    mesh_self_capture = self_capture.groupby('mesh_id')['captured_demand'].sum().reset_index()

    map_gdf_projected = pd.merge(demand_mesh_gdf_projected[['mesh_id', 'geometry', 'population']], mesh_self_capture, on='mesh_id', how='left')
    map_gdf_projected['captured_demand_self'] = map_gdf_projected['captured_demand'].fillna(0)
    map_gdf_projected['capture_ratio_self'] = 0.0
    valid_pop_mask = map_gdf_projected['population'] > 0
    map_gdf_projected.loc[valid_pop_mask, 'capture_ratio_self'] = (map_gdf_projected.loc[valid_pop_mask, 'captured_demand_self'] / map_gdf_projected.loc[valid_pop_mask, 'population']).clip(0, 1) * 100

    # --- Folium表示用に地理座標系に変換 ---
    map_gdf_geo = map_gdf_projected.to_crs(target_crs_geo)
    stores_gdf_geo = stores_gdf_projected.to_crs(target_crs_geo)
    if selected_new_stores_gdf_projected is not None and not selected_new_stores_gdf_projected.empty:
        selected_new_stores_gdf_geo = selected_new_stores_gdf_projected.to_crs(target_crs_geo)
    else:
        selected_new_stores_gdf_geo = None
    # --- ここまで変換 ---

    # 2. 地図の作成 (Folium)
    center_lat, center_lon = map_gdf_geo.geometry.unary_union.centroid.y, map_gdf_geo.geometry.unary_union.centroid.x
    m = folium.Map(location=[center_lat, center_lon], zoom_start=12, tiles='cartodbpositron') # タイルも変更可能

    # 3. Choropleth レイヤー
    folium.Choropleth(
        geo_data=map_gdf_geo.to_json(),
        name='Self Chain Capture Ratio (%)',
        data=map_gdf_geo, # Foliumには地理座標系のデータを渡す
        columns=['mesh_id', 'capture_ratio_self'],
        key_on='feature.properties.mesh_id',
        fill_color='Blues',
        fill_opacity=0.7,
        line_opacity=0.2,
        legend_name='Self Chain Demand Capture Ratio (%)',
        bins=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    ).add_to(m)

    # 4. 店舗マーカー (地理座標系のデータを使用)
    self_stores_geo = stores_gdf_geo[stores_gdf_geo['type'] == 'self']
    if not self_stores_geo.empty:
        for idx, store in self_stores_geo.iterrows():
            folium.Marker(
                location=[store.geometry.y, store.geometry.x],
                popup=f"Existing Self: {store['id']}<br>Demand: {stores_gdf_projected.loc[idx, 'total_demand'] if 'total_demand' in stores_gdf_projected.columns else 'N/A'}", # 需要は元の投影データから
                icon=folium.Icon(color='blue', icon='shop')
            ).add_to(m)

    comp_stores_geo = stores_gdf_geo[stores_gdf_geo['type'] == 'comp']
    if not comp_stores_geo.empty:
        for idx, store in comp_stores_geo.iterrows():
            folium.Marker(
                location=[store.geometry.y, store.geometry.x],
                popup=f"Competitor: {store['id']}<br>Demand: {stores_gdf_projected.loc[idx, 'total_demand'] if 'total_demand' in stores_gdf_projected.columns else 'N/A'}",
                icon=folium.Icon(color='red', icon='shop')
            ).add_to(m)

    if selected_new_stores_gdf_geo is not None and not selected_new_stores_gdf_geo.empty:
         for idx, store in selected_new_stores_gdf_geo.iterrows():
            folium.Marker(
                location=[store.geometry.y, store.geometry.x],
                popup=f"Newly Selected: {store['id']}<br>Demand: {selected_new_stores_gdf_projected.loc[idx, 'total_demand'] if 'total_demand' in selected_new_stores_gdf_projected.columns else 'N/A'}",
                icon=folium.Icon(color='green', icon='star')
            ).add_to(m)

    folium.LayerControl().add_to(m)
    return m

# --- 5. シミュレーション実行 ---
if __name__ == '__main__':
    # jismeshライブラリの存在確認 (簡易的)
    try:
        import jismesh.utils # インポートテストも utils を含めて行う
    except ImportError:
        print("Error: 'jismesh' library is required but not installed or jismesh.utils cannot be imported.")
        print("Please install it using: pip install jismesh")
        exit()

    print(f"1. Loading and preparing data (using {POP_MESH_LEVEL} mesh data)...")
    try:
        candidates_gdf, demand_mesh_gdf, existing_stores_gdf = load_and_prepare_data(
            pop_data_dir=POP_DATA_DIR, # ディレクトリパスを渡す
            pop_mesh_col=POP_MESH_COL,
            pop_value_col=POP_VALUE_COL,
            pop_csv_encoding=POP_CSV_ENCODING,
            csv_header_row=CSV_HEADER_ROW,
            n_candidates=N_CANDIDATES,          # ダミー用
            n_existing_self=N_EXISTING_SELF,    # ダミー用
            n_existing_comp=N_EXISTING_COMP,    # ダミー用
            initial_crs=TARGET_CRS_GEOGRAPHIC,
            target_projected_crs=TARGET_CRS_PROJECTED
        )
    except (ValueError, FileNotFoundError) as e:
        print(f"\nError during data preparation: {e}")
        exit() # データ読み込み失敗時は終了


    print("\n2. Running Greedy Algorithm for new store selection (using projected CRS)...")
    selected_new_stores_gdf, final_store_demand_df = greedy_new_store_selection(
        candidates_gdf, # 投影座標系
        demand_mesh_gdf, # 投影座標系
        existing_stores_gdf, # 投影座標系
        n_new_stores=N_NEW_STORES_GREEDY,
        distance_decay=DISTANCE_DECAY,
        max_distance=MAX_DISTANCE_M,
        min_demand_per_store=MIN_DEMAND_PER_STORE
    )

    print("\n3. Final Store Demand Summary (from projected data):")
    print(final_store_demand_df)

    # 既存店と新店を結合 (どちらも投影座標系)
    all_final_stores_projected = pd.concat([
        existing_stores_gdf, # 既に投影座標系
        selected_new_stores_gdf # 貪欲法の出力も投影座標系
    ], ignore_index=True)

    # final_store_demand_df から 'total_demand' を all_final_stores_projected にマージ
    # マージ前に all_final_stores_projected に 'id' 列が存在することを確認
    if 'id' in all_final_stores_projected.columns and not final_store_demand_df.empty:
        all_final_stores_projected = pd.merge(all_final_stores_projected, final_store_demand_df[['store_id', 'total_demand']],
                                              left_on='id', right_on='store_id', how='left')
        # マージ後、不要になった store_id 列を削除 (存在すれば)
        if 'store_id' in all_final_stores_projected.columns:
            all_final_stores_projected = all_final_stores_projected.drop(columns=['store_id'])
    elif 'total_demand' not in all_final_stores_projected.columns:
         all_final_stores_projected['total_demand'] = 0 # マージできなかった場合、列を追加して0埋め


    # 最終的なメッシュごとの獲得状況を計算 (入力は投影座標系)
    final_capture_df, _ = calculate_demand_capture(
        demand_mesh_gdf,
        all_final_stores_projected.rename(columns={'id':'store_id'}), # 計算用にリネーム
        DISTANCE_DECAY,
        MAX_DISTANCE_M
    )

    print("\n4. Generating map (converting data to geographic CRS for Folium)...")
    result_map = create_choropleth_map_folium(
        demand_mesh_gdf, # 投影座標系のメッシュ
        final_capture_df, # 計算結果
        all_final_stores_projected, # 全店舗 (既存店と新規店、投影座標系、total_demand含む)
        # selected_new_stores_gdf, # 可視化関数内で区別するので不要
        target_crs_geo=TARGET_CRS_GEOGRAPHIC
    )

    if result_map:
        map_filename = f"store_simulation_map_greedy_{POP_MESH_LEVEL}.html"
        result_map.save(map_filename)
        print(f"\nMap saved to {map_filename}")

    # --- 結果サマリー表示 ---
    total_population = demand_mesh_gdf['population'].sum()
    total_captured_self = 0
    if not final_store_demand_df.empty and 'type' in final_store_demand_df.columns:
        total_captured_self = final_store_demand_df[final_store_demand_df['type'] == 'self']['total_demand'].sum()
    capture_percentage = (total_captured_self / total_population) * 100 if total_population > 0 else 0

    print("\n--- Simulation Summary (Greedy) ---")
    print(f"Population Data: {POP_MESH_LEVEL} mesh from {POP_DATA_DIR}")
    print(f"Target Projected CRS for calculations: {TARGET_CRS_PROJECTED}")
    print(f"Target Geographic CRS for map: {TARGET_CRS_GEOGRAPHIC}")
    print(f"Total Population in Area: {total_population:,.0f}")
    print(f"Total Captured Demand (Self Chain): {total_captured_self:,.2f}")
    print(f"Self Chain Capture Percentage: {capture_percentage:.2f}%")
    print(f"Number of Existing Self Stores: {len(existing_stores_gdf[existing_stores_gdf['type']=='self'])}")
    print(f"Number of Existing Competitor Stores: {len(existing_stores_gdf[existing_stores_gdf['type']=='comp'])}")
    print(f"Number of Newly Selected Stores: {len(selected_new_stores_gdf)}")