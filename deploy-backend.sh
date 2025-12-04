#!/bin/bash

# Deploy backend to Cloud Run
# Make sure you're authenticated: gcloud auth login
# Make sure Docker is installed and running

set -e

echo "Building and deploying backend to Cloud Run..."

# Set variables
PROJECT_ID="smrtvocab"
SERVICE_NAME="smrtvocab-api"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "ERROR: Docker is not running. Please start Docker."
    exit 1
fi

# Verify we're in the right directory
if [ ! -f "backend/Dockerfile" ]; then
    echo "ERROR: Dockerfile not found. Make sure you're in the project root directory."
    exit 1
fi

# Verify template CSV files exist
TEMPLATE_COUNT=$(find backend/UserWords -name "Template_*.csv" 2>/dev/null | wc -l)
if [ "$TEMPLATE_COUNT" -eq 0 ]; then
    echo "WARNING: No template CSV files found in backend/UserWords/"
    echo "The app may not work correctly without template files."
else
    echo "Found $TEMPLATE_COUNT template CSV files"
fi

# Build the Docker image
echo "Building Docker image..."
cd backend
if ! gcloud builds submit --tag ${IMAGE_NAME} --project ${PROJECT_ID}; then
    echo "ERROR: Failed to build Docker image"
    cd ..
    exit 1
fi

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
if ! gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" \
  --project ${PROJECT_ID} \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10; then
    echo "ERROR: Failed to deploy to Cloud Run"
    cd ..
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)')

if [ -z "$SERVICE_URL" ]; then
    echo "ERROR: Could not retrieve service URL"
    cd ..
    exit 1
fi

cd ..

echo ""
echo "Backend deployed successfully!"
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "Next steps:"
echo "1. Create or update frontend/.env.production with:"
echo "   VITE_API_BASE_URL=${SERVICE_URL}/api"
echo ""
echo "2. Build and deploy frontend:"
echo "   cd frontend"
echo "   npm run build"
echo "   cd .."
echo "   firebase deploy --only hosting"
echo ""

