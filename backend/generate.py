#!/usr/bin/env python3
"""
Script to generate PDF with player names and photos from MongoDB
Run this on your local machine with internet access

Installation:
pip install pymongo reportlab pillow requests

Usage:
python generate_players_pdf_local.py
"""

import os
from pymongo import MongoClient
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
import requests
from io import BytesIO
from PIL import Image as PILImage

# MongoDB connection
MONGO_URI = "mongodb+srv://digital-althaf:RpCiI41GeCzRme9J@cluster0.n1h85qi.mongodb.net/dpl-cricket?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "calcutta_cricket_league"
COLLECTION_NAME = "players"

# Base URL for images
BASE_IMAGE_URL = "https://dpl.bitroxy.co"

def connect_to_mongodb():
    """Connect to MongoDB and return collection"""
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        # Test connection
        client.server_info()
        print(f"✓ Connected to MongoDB database: {DATABASE_NAME}")
        return collection
    except Exception as e:
        print(f"✗ Error connecting to MongoDB: {e}")
        return None

def fetch_players(collection):
    """Fetch all players from the collection"""
    try:
        players = list(collection.find({}, {"name": 1, "image_url": 1, "_id": 0}))
        print(f"✓ Fetched {len(players)} players from database")
        return players
    except Exception as e:
        print(f"✗ Error fetching players: {e}")
        return []

def download_image(image_url, max_size=(200, 200)):
    """Download image from URL and return as ReportLab Image object"""
    try:
        # Construct full URL if relative path
        if image_url.startswith('/'):
            full_url = BASE_IMAGE_URL + image_url
        else:
            full_url = image_url
        
        print(f"  Downloading: {full_url}")
        
        # Download image
        response = requests.get(full_url, timeout=10)
        response.raise_for_status()
        
        # Open image with PIL and resize
        img = PILImage.open(BytesIO(response.content))
        img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
        
        # Save to BytesIO
        img_byte_arr = BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        # Create ReportLab Image
        reportlab_img = Image(img_byte_arr, width=150, height=150)
        return reportlab_img
        
    except Exception as e:
        print(f"  ✗ Error downloading image {image_url}: {e}")
        # Return placeholder text if image fails
        styles = getSampleStyleSheet()
        return Paragraph(f"<i>Image not available</i>", styles['Normal'])

def generate_pdf(players, output_filename="dpl_players.pdf"):
    """Generate PDF with player names and photos"""
    
    print(f"\n📄 Generating PDF: {output_filename}")
    
    # Create PDF
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    # Container for PDF elements
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    player_name_style = ParagraphStyle(
        'PlayerName',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=10
    )
    
    # Title
    title = Paragraph("DPL - Players List", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.3*inch))
    
    # Add players (2 per row for better layout)
    players_per_row = 2
    
    for i in range(0, len(players), players_per_row):
        row_data = []
        
        for j in range(players_per_row):
            if i + j < len(players):
                player = players[i + j]
                player_name = player.get('name', 'Unknown Player')
                image_url = player.get('image_url', '')
                
                print(f"\nProcessing player {i+j+1}/{len(players)}: {player_name}")
                
                # Create cell content
                cell_elements = []
                
                # Download and add image
                if image_url:
                    img = download_image(image_url)
                    cell_elements.append(img)
                else:
                    cell_elements.append(Paragraph("<i>No photo</i>", styles['Normal']))
                
                # Add player name
                cell_elements.append(Spacer(1, 0.1*inch))
                cell_elements.append(Paragraph(player_name, player_name_style))
                
                row_data.append(cell_elements)
            else:
                row_data.append('')  # Empty cell
        
        # Create table for this row
        table = Table([row_data], colWidths=[3.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Add page break every 3 rows to avoid overcrowding
        if (i // players_per_row + 1) % 3 == 0 and i + players_per_row < len(players):
            elements.append(PageBreak())
    
    # Build PDF
    try:
        doc.build(elements)
        print(f"\n✓ PDF generated successfully: {output_filename}")
        return output_filename
    except Exception as e:
        print(f"\n✗ Error generating PDF: {e}")
        return None

def main():
    """Main function"""
    print("=" * 60)
    print("  Calcutta Cricket League - Player PDF Generator")
    print("=" * 60)
    
    # Connect to MongoDB
    collection = connect_to_mongodb()
    # if not collection:
    #     print("\n❌ Could not connect to MongoDB")
    #     print("Please check:")
    #     print("  1. Your internet connection")
    #     print("  2. MongoDB credentials are correct")
    #     print("  3. IP is whitelisted in MongoDB Atlas")
    #     return
    
    # Fetch players
    players = fetch_players(collection)
    if not players:
        print("No players found in database")
        return
    
    # Generate PDF
    output_file = "dpl_players.pdf"
    pdf_path = generate_pdf(players, output_file)
    
    if pdf_path:
        print("\n" + "=" * 60)
        print(f"✓ SUCCESS! PDF saved to: {pdf_path}")
        print("=" * 60)

if __name__ == "__main__":
    main()