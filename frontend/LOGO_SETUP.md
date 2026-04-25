# Logo Setup Instructions

## Adding Your Logo Image

To add your logo image to the Apni Dukan app:

1. **Place your logo file** in the `frontend/public/` directory
2. **Name it** `logo.png` (or update the code to use your filename)
3. **Recommended size**: 200x200px or larger (square format works best)
4. **Supported formats**: PNG, JPG, SVG, WebP

### Current Logo Implementation

The logo is currently set up to load from `/logo.png` in the following places:
- **Navbar** (top left)
- **Login Page** (centered above form)
- **Signup Page** (centered above form)

### Fallback Behavior

If the logo file is not found, the app will automatically show a shopping cart emoji (🛒) as a fallback.

### To Use a Different Logo File

If you want to use a different filename or format, update the `src` attribute in:
- `frontend/components/Navbar.tsx` (line ~59)
- `frontend/app/login/page.tsx` (line ~45)
- `frontend/app/signup/page.tsx` (line ~45)

Change `/logo.png` to your filename, e.g., `/logo.svg` or `/my-logo.jpg`
