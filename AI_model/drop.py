import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv("AI_model/sensor.csv")  # Replace with your actual file path

# Compute the magnitude of the orientation vector
df['acc_magnitude'] = np.sqrt(
    df['Orientation_x']**2 + df['Orientation_y']**2 + df['Orientation_z']**2
)

# Drop the original orientation columns
df.drop(['Orientation_x', 'Orientation_y', 'Orientation_z'], axis=1, inplace=True)

# Save the new dataframe if needed
df.to_csv("AI_model/sensor_1.csv", index=False)

# Optional: print first few rows
print(df.head())
