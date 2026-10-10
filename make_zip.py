import os, zipfile

with zipfile.ZipFile("lambda.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk("package"):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for f in files:
            full = os.path.join(root, f)
            z.write(full, os.path.relpath(full, "package"))
print("lambda.zip created")