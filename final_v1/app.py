"""
Streamlit app: GrindOps Quote Generator Data – AI & Data Science (OIM7507-B)
Overview, data quality, distributions, map, and model.
When you upload a CSV, all analysis uses that data. Otherwise project files are used.
Run from final_v1: streamlit run app.py
"""

import streamlit as st
import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_RAW = ROOT / "data" / "raw" / "zoopla_raw.csv"
DATA_LABELED = ROOT / "data" / "processed" / "zoopla_labeled.csv"
DATA_QUALITY = ROOT / "reports" / "tables" / "data_quality_summary.csv"
FIG_DIR = ROOT / "reports" / "figures"
MAP_HTML = FIG_DIR / "map_by_city.html"
MODEL_PATH = ROOT / "models" / "price_rf.pkl"


def load_data():
    """Return the active df: uploaded CSV if any, else project labeled/raw."""
    if st.session_state.get("uploaded_df") is not None:
        return st.session_state.uploaded_df.copy()
    if DATA_LABELED.exists():
        return pd.read_csv(DATA_LABELED)
    if DATA_RAW.exists():
        return pd.read_csv(DATA_RAW)
    return None


def load_raw_for_overview():
    """For Overview: prefer uploaded df, then raw (first 5 rows)."""
    if st.session_state.get("uploaded_df") is not None:
        return st.session_state.uploaded_df
    if DATA_RAW.exists():
        return pd.read_csv(DATA_RAW, nrows=5)
    return None


st.set_page_config(page_title="GrindOps Dataset – AI & Data Science", layout="wide")

st.title("🏠 GrindOps Quote Generator Data")
st.caption("OIM7507-B AI and Data Science – Group Assignment | University of Bradford")

# Sidebar: upload CSV (all analysis uses this when provided)
with st.sidebar:
    uploaded = st.file_uploader(
        "Upload CSV",
        type=["csv"],
        help="Upload a CSV file; all analysis below will use this data instead of project files.",
    )
    if uploaded is not None:
        try:
            st.session_state.uploaded_df = pd.read_csv(uploaded)
            st.success(f"Loaded {len(st.session_state.uploaded_df):,} rows.")
        except Exception as e:
            st.error(f"Error reading CSV: {e}")
            if "uploaded_df" in st.session_state:
                del st.session_state.uploaded_df
    else:
        if "uploaded_df" in st.session_state:
            del st.session_state.uploaded_df
        st.info("No upload: using project data (raw/labeled).")

section = st.sidebar.radio(
    "Section",
    [
        "Overview",
        "Data & Stats",
        "Data Quality",
        "Distributions & Explore",
        "Map by City",
        "Price Prediction Model",
    ],
)

# --- Overview ---
if section == "Overview":
    st.header("Project overview")
    st.markdown("""
    - **Data source:** GrindOps quote generator (Rep Grinding, Badge Grinding), collected via browser extension / pipeline.
    - **Pipeline:** Raw → Cleaning & Feature Engineering → Annotation (price_category) → ML demo.
    - **Paths:** `data/raw`, `data/cleaned`, `data/processed`, `reports/figures`, `models/`.
    """)
    df_overview = load_raw_for_overview()
    if df_overview is not None:
        is_uploaded = st.session_state.get("uploaded_df") is not None
        st.subheader("Current data – first 5 rows" if is_uploaded else "Raw data – first 5 rows")
        display = df_overview.head() if isinstance(df_overview, pd.DataFrame) else df_overview
        st.dataframe(display, use_container_width=True)
        n = len(st.session_state.uploaded_df) if is_uploaded else (sum(1 for _ in open(DATA_RAW)) - 1 if DATA_RAW.exists() else 0)
        st.metric("Row count", f"{n:,}")
    else:
        st.warning("No data. Upload a CSV or add `data/raw/zoopla_raw.csv`.")

# --- Data & Stats ---
elif section == "Data & Stats":
    st.header("Data & summary stats")
    df = load_data()
    if df is None:
        st.warning("No data. Upload a CSV or run notebooks 01→04.")
    else:
        if "price" in df.columns:
            df["price"] = pd.to_numeric(df["price"], errors="coerce")
        c1, c2, c3 = st.columns(3)
        c1.metric("Rows", f"{len(df):,}")
        c2.metric("Columns", len(df.columns))
        c3.metric("Avg price (£)", f"{df['price'].mean():,.0f}" if "price" in df.columns else "—")
        st.subheader("Sample")
        st.dataframe(df.head(100), use_container_width=True)
        if "price_category" in df.columns:
            st.subheader("price_category distribution")
            st.bar_chart(df["price_category"].value_counts())

# --- Data Quality ---
elif section == "Data Quality":
    st.header("Data quality report")
    df = load_data()
    if df is not None:
        q = pd.DataFrame({
            "column": df.columns,
            "non_null": df.count().values,
            "null_count": df.isna().sum().values,
            "null_pct": (df.isna().sum() / len(df) * 100).values,
        })
        st.dataframe(q, use_container_width=True)
        st.bar_chart(q.set_index("column")["null_pct"])
    elif DATA_QUALITY.exists():
        q = pd.read_csv(DATA_QUALITY)
        st.dataframe(q, use_container_width=True)
        if "null_pct" in q.columns:
            st.bar_chart(q.set_index("column")["null_pct"])
    else:
        st.warning("No data. Upload a CSV or run notebook 02.")

# --- Distributions & Explore ---
elif section == "Distributions & Explore":
    st.header("Distributions & explore")
    df = load_data()
    if df is None:
        st.warning("No data. Upload a CSV or run the pipeline.")
    else:
        if "price" in df.columns:
            df["price"] = pd.to_numeric(df["price"], errors="coerce")
            df = df.dropna(subset=["price"])
        numeric_cols = [c for c in ["price", "bedrooms", "bathrooms", "area_sqft", "price_per_sqft"] if c in df.columns]
        col = st.selectbox("Variable", numeric_cols if numeric_cols else df.columns.tolist(), index=0)
        if col:
            x = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(x) > 0 and col == "price":
                x = x[x.between(x.quantile(0.01), x.quantile(0.99))]
            if len(x) > 0:
                st.bar_chart(x.value_counts().sort_index().head(50))
        if "city" in df.columns and "price" in df.columns:
            st.subheader("Price by city (top 10)")
            top_cities = df["city"].value_counts().head(10).index.tolist()
            by_city = df[df["city"].isin(top_cities)].groupby("city")["price"].agg(["mean", "count"]).round(0)
            st.dataframe(by_city)

# --- Map ---
elif section == "Map by City":
    st.header("Map by city")
    if not MAP_HTML.exists():
        st.warning("No map file. Run notebook 02 (map cell).")
    else:
        with open(MAP_HTML, encoding="utf-8") as f:
            st.components.v1.html(f.read(), height=500, scrolling=True)

# --- Model ---
elif section == "Price Prediction Model":
    st.header("Price prediction model (Random Forest)")
    if not MODEL_PATH.exists():
        st.info("No price_rf.pkl. Run notebook 05 to train and save the model.")
    else:
        import joblib
        model = joblib.load(MODEL_PATH)
        st.success("Model loaded.")
        if hasattr(model, "feature_importances_"):
            imp = pd.Series(model.feature_importances_, index=[f"f{i}" for i in range(len(model.feature_importances_))])
            st.subheader("Feature importance (top 15)")
            st.bar_chart(imp.nlargest(15))

st.sidebar.markdown("---")
st.sidebar.markdown("**GrindOps** – Quote Generator Data")
