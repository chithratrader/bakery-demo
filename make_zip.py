import os
import shutil
import zipfile

# 1. Always copy the latest versions of your own files into package/
for f in ["lambda_function.py", "about_me.txt"]:
    shutil.copy(f, os.path.join("package", f))

# 2. Rebuild the zip from scratch
if os.path.exists("lambda.zip"):
    os.remove("lambda.zip")

with zipfile.ZipFile("lambda.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk("package"):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for name in files:
            full = os.path.join(root, name)
            z.write(full, os.path.relpath(full, "package"))
print("lambda.zip created")

# 3. Show the model line that is inside the zip
with zipfile.ZipFile("lambda.zip") as z:
    for line in z.read("lambda_function.py").decode().splitlines():
        if "ChatGroq(" in line:
            print("In zip:", line.strip())