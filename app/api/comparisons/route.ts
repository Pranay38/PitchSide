import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'comparisons.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Comparisons not found' }, { status: 404 });
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const comparisons = JSON.parse(fileContents);
    return NextResponse.json(comparisons);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load comparisons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newComparison = await request.json();
    const filePath = path.join(process.cwd(), 'data', 'comparisons.json');
    let comparisons = [];
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      comparisons = JSON.parse(fileContents);
    }
    
    comparisons.push(newComparison);
    fs.writeFileSync(filePath, JSON.stringify(comparisons, null, 2));
    
    return NextResponse.json({ success: true, comparison: newComparison }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comparison' }, { status: 500 });
  }
}
