# Use lightweight Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Copy all files to container
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Run Flask app
CMD ["python", "app.py"]
