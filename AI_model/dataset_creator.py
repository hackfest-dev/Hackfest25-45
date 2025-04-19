from touch_sdk import Watch
import logging
import csv
import os
import time

# Configure logging
logging.basicConfig(level=logging.INFO)

filename = 'AI_model/sensor.csv'

class MyWatch(Watch):
    def __init__(self):
        super().__init__()
        self.i = 0  # Instance variable to track initialization
        self.start_time = None  # Instance variable to store start time
        self.current_id = 1  # Initialize ID for each segment

        # Check if the file exists
        if not os.path.isfile(filename):
            # Create file and write header
            with open(filename, mode='w', newline='') as csvfile:
                self.writer = csv.writer(csvfile)
                self.writer.writerow(['ID', 'Elapsed Time (s)', 
                                     'Acceleration_x', 'Acceleration_y', 'Acceleration_z', 
                                     'Gravity_x', 'Gravity_y', 'Gravity_z', 
                                     'Angular Velocity_x', 'Angular Velocity_y', 'Angular Velocity_z', 
                                     'Orientation_x', 'Orientation_y', 'Orientation_z', 
                                     'Character'])
                logging.info(f"{filename} created and header written.")
        else:
            logging.info(f"{filename} already exists. Appending data...")
            self.csvfile = open(filename, mode='a', newline='')
            self.writer = csv.writer(self.csvfile)

    def on_sensors(self, sensors):
        if self.i == 0:
            self.start_time = time.perf_counter()  # Correctly set the start timez
            self.i = 1
        elapsed_time = time.perf_counter() - self.start_time  # Calculate elapsed time

        if elapsed_time > 3:
            return  # Stop recording after 3 seconds
        
        # Log the elapsed time for debugging
        logging.info(f"Elapsed time: {elapsed_time}")

        # Prepare the data in the desired format
        data = [
            234,
            elapsed_time,  # Elapsed time in seconds
            sensors.acceleration[0], sensors.acceleration[1], sensors.acceleration[2],  # Separate acceleration components
            sensors.gravity[0], sensors.gravity[1], sensors.gravity[2],  # Separate gravity components
            sensors.angular_velocity[0], sensors.angular_velocity[1], sensors.angular_velocity[2],  # Separate angular velocity components
            sensors.orientation[0], sensors.orientation[1], sensors.orientation[2],  # Separate orientation components
            "No gesture"  # Character or label for gesture
        ]
        
        # Write the data to the CSV file
        self.writer.writerow(data)
        logging.info(f"Recorded data: {data}")

    def close(self):
        # Close the CSV file when done
        if hasattr(self, 'csvfile'):
            self.csvfile.close()
            logging.info("CSV file closed.")

# Example usage
watch = MyWatch()
try:
    watch.start()  # Start the watch to collect sensor data
except KeyboardInterrupt:
    watch.close()  # Close the CSV file on interrupt
    logging.info("Data collection stopped.")
