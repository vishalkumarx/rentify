import os
import re

toast_import = "import toast from 'react-hot-toast';\n"

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "alert(" not in content:
        return

    # Add import if not present
    if "import toast from 'react-hot-toast';" not in content:
        # Find first import or line 0
        match = re.search(r"^import .*", content, re.MULTILINE)
        if match:
            content = content[:match.start()] + toast_import + content[match.start():]
        else:
            content = toast_import + content

    # Replace specific alerts based on keywords
    # "successfully" -> toast.success
    # "approved" -> toast.success
    # "coming soon" -> toast.success or toast('...', { icon: 'ℹ️' })
    # default -> toast.error
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if "alert(" in line:
            if "success" in line.lower() or "approved" in line.lower():
                lines[i] = line.replace("alert(", "toast.success(")
            elif "coming soon" in line.lower() or "notified" in line.lower():
                lines[i] = line.replace("alert(", "toast.success(")
            else:
                lines[i] = line.replace("alert(", "toast.error(")

    with open(filepath, 'w') as f:
        f.write('\n'.join(lines))

directory = '/Users/vishalkumar/Desktop/SampleApp/CampusRentApp/src'
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Done")
