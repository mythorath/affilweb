# AffiliateWeb

A web application for affiliate marketing management.

## Getting Started

This project is currently in development. The repository includes an automatic diff generation system that creates unique diff files for every push to GitHub.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/mythorath/affilweb.git
   cd affilweb
   ```

2. Install the git hooks for automatic diff generation:
   ```
   powershell.exe -ExecutionPolicy Bypass -File "install-hooks.ps1"
   ```

3. Create a virtual environment:
   ```
   python -m venv venv
   ```

4. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

5. Install dependencies (when available):
   ```
   pip install -r requirements.txt
   ```

## Diff System

This repository automatically generates diff files for every push. See `DIFF_SYSTEM.md` for detailed information about the automatic diff generation system.

## Contributing

Please read the contributing guidelines before making any changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
