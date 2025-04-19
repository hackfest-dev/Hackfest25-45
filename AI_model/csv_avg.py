import pandas as pd
import numpy as np

# Load your dataset
data = pd.read_csv('AI_model/sensor.csv')  # Replace with your actual file path

# Define the segment length (each segment will have 130 rows of sensor data)
sequence_length = 130  # Each segment will have 130 rows

# List to store the segments (one row for each ID containing an array of sequential data)
segments = []

# Group data by 'ID' and create a single row for each unique ID
for id_, group in data.groupby('ID'):
    # Extract the gesture label (Character) - assuming the label is the same for all rows of the group
    label = group['Character'].iloc[0]
    
    # Select all columns except 'ID' and 'Character' for the sensor data
    sensor_data = group.iloc[:, 2:-1].values  # This selects all sensor data columns
    
    # Ensure we have at least 130 rows, otherwise skip this ID (or handle as needed)
    if len(sensor_data) >= sequence_length:
        # Take the first 130 rows
        segment = sensor_data[:sequence_length]
        # Append the segment as a list (sequential data array)
        segments.append([segment.tolist(), label])  # Store the sequential data array and label

# Create column names for the new DataFrame
columns = ['Sequential_Data', 'Character']  # 'Sequential_Data' will be the array of sequential data, 'Character' for the label

# Create a DataFrame from the segments
segments_df = pd.DataFrame(segments, columns=columns)

# Save the new dataset as a CSV file
segments_df.to_csv('AI_model/segmented_sequential_data.csv', index=False)

print("Segmentation complete. New dataset saved as 'segmented_sequential_data.csv'.")
