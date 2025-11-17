import unittest
import json
from app import app

class TestPredictionAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_predict_endpoint_with_valid_image(self):
        """Test prediction endpoint with valid plant image"""
        with open('test_assets/plant_image.jpg', 'rb') as f:
            response = self.app.post(
                '/predict',
                data={'image': f},
                content_type='multipart/form-data'
            )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('species', data)
        self.assertIn('confidence', data)
        self.assertGreater(data['confidence'], 0.7)

    def test_predict_endpoint_missing_image(self):
        """Test prediction endpoint without image"""
        response = self.app.post('/predict', data={})
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', json.loads(response.data))

    def test_predict_with_unsupported_format(self):
        """Test prediction with invalid file format"""
        with open('test_assets/document.pdf', 'rb') as f:
            response = self.app.post(
                '/predict',
                data={'image': f},
                content_type='multipart/form-data'
            )
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()