#!/usr/bin/env python3
"""
Setup profiles collection with indexes
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

async def setup_profiles():
    print("Setting up profiles collection...")
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Create indexes
    await db.profiles.create_index("id", unique=True)
    await db.profiles.create_index("account_id")
    await db.profiles.create_index([("account_id", 1), ("is_primary", 1)])
    await db.profiles.create_index("last_active")
    
    print("✓ Profiles collection indexes created")
    print("✓ Ready for multi-profile system")

if __name__ == "__main__":
    asyncio.run(setup_profiles())
