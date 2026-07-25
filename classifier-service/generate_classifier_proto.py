import os
import subprocess
import sys

def main():
    print("Generating gRPC proto stubs for classifier...")
    # Ensure generated directory exists
    os.makedirs("generated", exist_ok=True)
    
    # Run protoc command
    cmd = [
        sys.executable,
        "-m",
        "grpc_tools.protoc",
        "-I",
        "protos",
        "--python_out=generated",
        "--grpc_python_out=generated",
        "protos/classifier.proto"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("Proto stubs generated successfully inside generated/")
    except subprocess.CalledProcessError as e:
        print(f"Error compiling proto: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
