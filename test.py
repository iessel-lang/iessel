import os

def add_gitkeep(target_directory="."):
    """
    Recursively adds a .gitkeep file to every empty directory 
    within the target path.
    """
    for root, dirs, files in os.walk(target_directory):
        # Check if the current directory is empty
        # dirs: subdirectories, files: files in the current folder
        if not dirs and not files:
            file_path = os.path.join(root, ".gitkeep")
            
            try:
                with open(file_path, 'w') as f:
                    # Creating an empty file
                    pass
                print(f"Added: {file_path}")
            except Exception as e:
                print(f"Failed to create {file_path}: {e}")

if __name__ == "__main__":
    # You can change "." to a specific path like "./my_project"
    path_to_scan = "." 
    print(f"Scanning directory: {os.path.abspath(path_to_scan)}")
    add_gitkeep(path_to_scan)
    print("Done!")