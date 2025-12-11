"""
Script to copy all collections from MongoDB Atlas to local MongoDB.
"""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

# Source MongoDB (Atlas)
SOURCE_URI = "mongodb+srv://digital-althaf:RpCiI41GeCzRme9J@cluster0.n1h85qi.mongodb.net/dpl-cricket?retryWrites=true&w=majority&appName=Cluster0"
SOURCE_DB_NAME = "calcutta_cricket_league"

# Destination MongoDB (Local)
DEST_URI = "mongodb://admin:password123@localhost:27017/calcutta_cricket_league?authSource=admin"
DEST_DB_NAME = "calcutta_cricket_league"


def copy_all_collections():
    """Copy all collections from source to destination database."""
    
    print("Connecting to source MongoDB (Atlas)...")
    try:
        source_client = MongoClient(SOURCE_URI)
        source_client.admin.command('ping')
        print("✓ Connected to source MongoDB")
    except ConnectionFailure as e:
        print(f"✗ Failed to connect to source MongoDB: {e}")
        return
    
    print("\nConnecting to destination MongoDB (Local)...")
    try:
        dest_client = MongoClient(DEST_URI)
        dest_client.admin.command('ping')
        print("✓ Connected to destination MongoDB")
    except ConnectionFailure as e:
        print(f"✗ Failed to connect to destination MongoDB: {e}")
        source_client.close()
        return
    
    source_db = source_client[SOURCE_DB_NAME]
    dest_db = dest_client[DEST_DB_NAME]
    
    # Get all collection names
    collections = source_db.list_collection_names()
    
    if not collections:
        print(f"\nNo collections found in source database '{SOURCE_DB_NAME}'")
        source_client.close()
        dest_client.close()
        return
    
    print(f"\nFound {len(collections)} collection(s): {collections}")
    
    total_docs_copied = 0
    
    for collection_name in collections:
        print(f"\n--- Copying collection: {collection_name} ---")
        
        source_collection = source_db[collection_name]
        dest_collection = dest_db[collection_name]
        
        # Get all documents from source
        documents = list(source_collection.find())
        doc_count = len(documents)
        
        if doc_count == 0:
            print(f"  No documents found in '{collection_name}'")
            continue
        
        print(f"  Found {doc_count} document(s)")
        
        # Clear destination collection before copying
        dest_collection.delete_many({})
        print(f"  Cleared existing data in destination")
        
        # Insert documents into destination
        try:
            result = dest_collection.insert_many(documents)
            inserted_count = len(result.inserted_ids)
            print(f"  ✓ Copied {inserted_count} document(s)")
            total_docs_copied += inserted_count
        except OperationFailure as e:
            print(f"  ✗ Failed to copy: {e}")
    
    print(f"\n{'='*50}")
    print(f"Migration complete!")
    print(f"Total collections processed: {len(collections)}")
    print(f"Total documents copied: {total_docs_copied}")
    print(f"{'='*50}")
    
    # Close connections
    source_client.close()
    dest_client.close()
    print("\nConnections closed.")


if __name__ == "__main__":
    copy_all_collections()

