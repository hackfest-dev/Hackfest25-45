import pandas as pd

# Load the sensor data CSV
sensor_data = pd.read_csv('AI_model/sensor.csv')

# Drop the orientation columns
sensor_data = sensor_data.drop(columns=['Orientation_x', 'Orientation_y', 'Orientation_z'])

# Save the updated data to a new CSV file
sensor_data.to_csv('AI_model/sensor.csv', index=False)

print("Orientation columns have been removed and the updated data is saved to 'updated_sensor.csv'.")
