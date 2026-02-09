from flask import Flask
from flask_cors import CORS
from copilotkit.integrations.flask import register_copilotkit_endpoint
from copilotkit import CopilotKitRemoteEndpoint

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})


register_copilotkit_endpoint(app, "/copilotkit")

if __name__ == '__main__':
    app.run(port=5000, debug=True)