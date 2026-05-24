#!/usr/bin/env python3
"""
Generate a CSV file for the batch import feature of this project.

The current app accepts `.txt` and `.csv` files and reads them as plain text,
so this script writes a UTF-8 BOM CSV that:
1. Opens cleanly in Excel with Chinese names.
2. Can be imported directly by the app.

Examples:
  python scripts/generate_student_import_csv.py
  python scripts/generate_student_import_csv.py --count 50 --prefix 学生
  python scripts/generate_student_import_csv.py --input names.txt --output class_a.csv
  python scripts/generate_student_import_csv.py --names 张三 李四 王五 --output students.csv
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


DEFAULT_NAMES = [
    "张三",
    "李四",
    "王五",
    "赵六",
    "孙七",
    "周八",
    "吴九",
    "郑十",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a CSV file for the random name picker import dialog."
    )
    parser.add_argument(
        "--output",
        default="students_import.csv",
        help="Output CSV file path. Default: students_import.csv",
    )
    parser.add_argument(
        "--input",
        help="Optional text file containing names. Supports one name per line or comma-separated names.",
    )
    parser.add_argument(
        "--names",
        nargs="+",
        help="Optional names passed directly from the command line.",
    )
    parser.add_argument(
        "--count",
        type=int,
        help="Generate sample names like '学生1', '学生2' when no input names are provided.",
    )
    parser.add_argument(
        "--prefix",
        default="学生",
        help="Prefix used together with --count. Default: 学生",
    )
    return parser.parse_args()


def split_names(text: str) -> list[str]:
    separators = [",", "，", "、", "\n", "\r", "\t"]
    for separator in separators:
        text = text.replace(separator, "\n")

    names = [line.strip() for line in text.split("\n")]
    return [name for name in names if name]


def load_names(args: argparse.Namespace) -> list[str]:
    if args.names:
        return [name.strip() for name in args.names if name.strip()]

    if args.input:
        content = Path(args.input).read_text(encoding="utf-8")
        names = split_names(content)
        if names:
            return names

    if args.count and args.count > 0:
        return [f"{args.prefix}{index}" for index in range(1, args.count + 1)]

    return DEFAULT_NAMES


def write_csv(output_path: Path, names: list[str]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as csv_file:
        writer = csv.writer(csv_file)
        for name in names:
            writer.writerow([name])


def main() -> None:
    args = parse_args()
    names = load_names(args)

    if not names:
        raise SystemExit("No valid names found.")

    output_path = Path(args.output)
    write_csv(output_path, names)

    print(f"Created: {output_path}")
    print(f"Students: {len(names)}")
    print("Import this CSV file directly in the app's batch import dialog.")


if __name__ == "__main__":
    main()
