#!/usr/bin/env python3
"""
CSV Cleaner for Trading Journal

This script cleans trading CSV files by:
1. Skipping the first 7 lines (metadata)
2. Reading the header from line 8
3. Removing unwanted columns and keeping only essential trading data
4. Outputting a clean CSV file

Usage:
    python csv_cleaner.py input_file.csv [output_file.csv]
    
If no output file is specified, it will create a file with "_cleaned" suffix.
"""

import csv
import sys
import os
from pathlib import Path

def clean_csv(input_file, output_file=None):
    """
    Clean the trading CSV file by removing metadata and unwanted columns.
    
    Args:
        input_file (str): Path to the input CSV file
        output_file (str, optional): Path to the output CSV file
        
    Returns:
        str: Path to the cleaned CSV file
    """
    
    # Generate output filename if not provided
    if output_file is None:
        input_path = Path(input_file)
        output_file = input_path.parent / f"{input_path.stem}_cleaned{input_path.suffix}"
    
    # Columns to keep (in the desired order)
    columns_to_keep = [
        'Closing Ref',
        'Closed', 
        'Opening Ref',
        'Opened',
        'Market',
        'Opening',
        'Closing',
        'P/L',
        'Total'
    ]
    
    # Columns to remove
    columns_to_remove = [
        'Period',
        'Direction',
        'Size',
        'Trade Ccy.',
        'Funding',
        'Borrowing',
        'Dividends',
        'LR Prem.',
        'Others',
        'Comm. Ccy.',
        'Comm.'
    ]
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            lines = infile.readlines()
        
        # Check if file has enough lines
        if len(lines) < 8:
            raise ValueError(f"Input file must have at least 8 lines. Found {len(lines)} lines.")
        
        # Extract header from line 8 (index 7)
        header_line = lines[7].strip()
        if not header_line:
            raise ValueError("Header line (line 8) is empty.")
        
        # Parse header
        original_headers = [h.strip() for h in header_line.split(',')]
        
        # Find indices of columns to keep
        column_indices = []
        missing_columns = []
        
        for col in columns_to_keep:
            try:
                index = original_headers.index(col)
                column_indices.append(index)
            except ValueError:
                missing_columns.append(col)
        
        if missing_columns:
            print(f"Warning: The following columns were not found in the header: {missing_columns}")
            print(f"Available columns: {original_headers}")
        
        # Verify we found at least some columns
        if not column_indices:
            raise ValueError("No matching columns found in the CSV header.")
        
        # Process data lines (from line 9 onwards)
        data_lines = lines[8:]  # Skip first 8 lines (metadata + header)
        
        cleaned_rows = []
        
        # Add cleaned header
        cleaned_header = [columns_to_keep[i] for i, _ in enumerate(column_indices)]
        cleaned_rows.append(cleaned_header)
        
        # Process each data line
        for line_num, line in enumerate(data_lines, start=9):
            line = line.strip()
            if not line:  # Skip empty lines
                continue
                
            # Split the line by comma
            values = [v.strip() for v in line.split(',')]
            
            # Check if line has enough columns
            if len(values) < max(column_indices) + 1:
                print(f"Warning: Line {line_num} has insufficient columns ({len(values)}). Skipping.")
                continue
            
            # Extract values for the columns we want to keep
            cleaned_values = []
            for index in column_indices:
                if index < len(values):
                    cleaned_values.append(values[index])
                else:
                    cleaned_values.append('')  # Add empty string for missing values
            
            cleaned_rows.append(cleaned_values)
        
        # Write cleaned CSV
        with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.writer(outfile)
            writer.writerows(cleaned_rows)
        
        print(f"✅ Successfully cleaned CSV file!")
        print(f"📁 Input file: {input_file}")
        print(f"📁 Output file: {output_file}")
        print(f"📊 Original columns: {len(original_headers)}")
        print(f"📊 Cleaned columns: {len(cleaned_header)}")
        print(f"📊 Data rows processed: {len(cleaned_rows) - 1}")
        
        # Show column mapping
        print(f"\n📋 Columns kept:")
        for i, col in enumerate(cleaned_header):
            original_index = column_indices[i]
            print(f"   {col} (column {original_index + 1})")
        
        print(f"\n🗑️  Columns removed:")
        for col in columns_to_remove:
            if col in original_headers:
                removed_index = original_headers.index(col)
                print(f"   {col} (column {removed_index + 1})")
        
        return str(output_file)
        
    except FileNotFoundError:
        raise FileNotFoundError(f"Input file not found: {input_file}")
    except Exception as e:
        raise Exception(f"Error processing CSV file: {str(e)}")

def main():
    """Main function to handle command line arguments."""
    
    if len(sys.argv) < 2:
        print("Usage: python csv_cleaner.py <input_file.csv> [output_file.csv]")
        print("\nExample:")
        print("  python csv_cleaner.py trades:3:6:25.csv")
        print("  python csv_cleaner.py trades:3:6:25.csv cleaned_trades.csv")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file '{input_file}' not found.")
        sys.exit(1)
    
    try:
        cleaned_file = clean_csv(input_file, output_file)
        print(f"\n🎉 CSV cleaning completed successfully!")
        print(f"💾 Cleaned file saved as: {cleaned_file}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 