import keras
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.utils import to_categorical

# Load your dataset
data = pd.read_csv('AI_model/sensor.csv')  # Replace with your actual file path

# Step 1: Segment data into sequences
# Assuming each segment lasts 3 seconds with a specific number of samples per segment
sequence_length = 100  # Adjust based on your data
segments = []

# Group data by ID (segment) and create sequences
for id_, group in data.groupby('ID'):
    # Extract the gesture label
    label = group['Character'].iloc[0]
    # Convert the group to numpy array and reshape
    samples = group.iloc[:, 2:-1].values  # Select all columns except 'ID' and 'Character'
    # Create segments of specified length
    for start in range(0, len(samples) - sequence_length + 1):
        segment = samples[start:start + sequence_length]
        segments.append((segment, label))

# Convert to DataFrame for easier manipulation
segment_df = pd.DataFrame(segments, columns=['Segment', 'Label'])

# Step 2: Prepare features and labels
X = np.array(segment_df['Segment'].tolist())  # Features
y = np.array(segment_df['Label'].tolist())  # Labels

# Step 3: Encode labels
y_encoded, unique_labels = pd.factorize(y)
y_categorical = to_categorical(y_encoded)  # Convert to one-hot encoding

# Step 4: Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y_categorical, test_size=0.2, random_state=42)

# Step 5: Build the LSTM model
model = Sequential()
model.add(LSTM(64, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])))
model.add(Dropout(0.2))
model.add(LSTM(64))
model.add(Dropout(0.2))
model.add(Dense(len(unique_labels), activation='softmax'))  # Adjust the number of outputs

# Step 6: Compile the model
model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

# Step 7: Train the model
history=model.fit(X_train, y_train, epochs=3, batch_size=32, validation_data=(X_test, y_test))

# Step 8: Evaluate the model
loss, accuracy = model.evaluate(X_test, y_test)
print(f'Test Loss: {loss:.4f}, Test Accuracy: {accuracy:.4f}')
keras.saving.save_model(model, 'AI_model/model.h5')

import matplotlib.pyplot as plt
# Extracting metrics
loss = history.history['loss']
val_loss = history.history['val_loss']
accuracy = history.history.get('accuracy')  # Optional, if accuracy is tracked
val_accuracy = history.history.get('val_accuracy')  # Optional, if accuracy is tracked
epochs = range(1, len(loss) + 1)
import matplotlib.pyplot as plt

# Extract metrics
loss = history.history['loss']
val_loss = history.history['val_loss']
accuracy = history.history.get('accuracy')
val_accuracy = history.history.get('val_accuracy')
epochs = range(1, len(loss) + 1)

# Create subplots
fig, ax = plt.subplots(1, 2, figsize=(16, 6))

# Plot Loss
ax[0].plot(epochs, loss, 'b', label='Training Loss')
ax[0].plot(epochs, val_loss, 'r', label='Validation Loss')
ax[0].set_title('Training and Validation Loss')
ax[0].set_xlabel('Epochs')
ax[0].set_ylabel('Loss')
ax[0].legend()
ax[0].grid(True)

# Plot Accuracy
ax[1].plot(epochs, accuracy, 'b', label='Training Accuracy')
ax[1].plot(epochs, val_accuracy, 'r', label='Validation Accuracy')
ax[1].set_title('Training and Validation Accuracy')
ax[1].set_xlabel('Epochs')
ax[1].set_ylabel('Accuracy')
ax[1].legend()
ax[1].grid(True)

# Display the plots
plt.tight_layout()
plt.show()
