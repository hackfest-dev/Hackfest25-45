import numpy as np
from tensorflow.keras.models import load_model
from touch_sdk import Watch
import logging

# Load the pre-trained model
model = load_model('AI_model/model.h5')  # Update with your model's path
unique_labels = ["hello", "thank you", "no gesture","what","your","name"]  # Update with actual unique labels
# Constants
sequence_length = 120  # Length of sequences for prediction
sampling_rate = 50  # Assume sensor provides data at 50 Hz
buffer_size = sampling_rate * 3  # Number of samples for 3 seconds

class RealTimeWatch(Watch):
    def __init__(self):
        super().__init__()
        self.data_buffer = []  # Buffer to hold incoming sensor data
        self.id = 0  # Placeholder for segment ID
        self.start_time = None  # To track the start time of data collection

    def on_sensors(self, sensors):
        # Gather raw sensor data from the sensors
        sensor_data = [
            sensors.acceleration[0],  # Acceleration_x
            sensors.acceleration[1],  # Acceleration_y
            sensors.acceleration[2],  # Acceleration_z
            sensors.gravity[0],       # Gravity_x
            sensors.gravity[1],       # Gravity_y
            sensors.gravity[2],       # Gravity_z
            sensors.angular_velocity[0],  # Angular Velocity_x
            sensors.angular_velocity[1],  # Angular Velocity_y
            sensors.angular_velocity[2],  # Angular Velocity_z
            sensors.orientation[0],   # Orientation_x
            sensors.orientation[1],   # Orientation_y
            sensors.orientation[2],   # Orientation_z
        ]

        # Append the sensor data with the averaged acceleration to the buffer
        self.data_buffer.append(sensor_data)

        # Check if we have collected enough data for a full 3 seconds
        if len(self.data_buffer) >= buffer_size:
            # Convert buffer to a numpy array for LSTM input
            segment = np.array(self.data_buffer[-buffer_size:])  # Get the latest 'buffer_size' samples
            
            # Reshape for prediction (input format: (1, sequence_length, 13), where 13 is the number of features)
            segment = segment.reshape((1, segment.shape[0], segment.shape[1]))  # (1, 130, 13)

            # Make a prediction
            prediction = model.predict(segment)
            predicted_class = np.argmax(prediction, axis=1)

            # Output the predicted class
            print(f"Predicted Character: {unique_labels[predicted_class[0]]}")  # Assuming 'unique_labels' is accessible

            # Clear the buffer after prediction
            self.data_buffer = []  # Optionally clear the buffer to start collecting data for the next prediction

# Example usage
watch = RealTimeWatch()
try:
    watch.start()  # Start the watch to collect sensor data
except KeyboardInterrupt:
    watch.close()  # Close the watch on interrupt
    logging.info("Data collection stopped.")
