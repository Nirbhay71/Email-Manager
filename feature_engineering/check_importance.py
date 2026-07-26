import os
import joblib
import pandas as pd

model_path = os.path.join(os.path.dirname(__file__), "global_model.pkl")
model = joblib.load(model_path)

if hasattr(model, 'feature_importances_'):
    importances = model.feature_importances_
    features = model.feature_name_
    df = pd.DataFrame({"Feature": features, "Importance": importances})
    df = df.sort_values("Importance", ascending=False)
    print(df.to_string(index=False))
else:
    print("Model has no feature_importances_ attribute.")
