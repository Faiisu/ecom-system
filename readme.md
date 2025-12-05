# E-commerce Campaigns management System

Project Owners : Sukum Decha

This is the function design for the E-commerce campaigns system, the module can create custom campaings through frontend ui and apply to transaction system correctly

**Live demo:** http://167.71.218.173:3001

## Features
- **Guest access:** Quick guest login to try the experience without sign-up friction.
- **Campaign creation:** Build campaigns with names, descriptions, and multiple discount styles (fixed amount, percent, points, spend-and-save) plus limits and thresholds (value caps, every-X-get-Y).
- **Targeting controls:** Attach campaigns to categories and set category priority to control discount sequence (remove campaigns isn't avaliable).
- **Product catalog:** Browse and search products by category to see how campaigns apply.
- **Cart and checkout:** Add to cart, view detailed summary, and see discounts applied from active campaigns.

## Tech Stack
- **Backend:**
    - Go 1.22
    - Swagger (gofiber/swagger)
    - Air (dev hot reload)
- **Frontend:** 
    - React (TypeScript + Vite)
    - Tailwind CSS
- **Deployment:**
    - Docker, Docker Compose
    - Nginx (serves frontend and proxies API)

## More details by folder
- Backend setup and API docs: see `backend/README.md`.
- Frontend setup and scripts: see `frontend/README.md`.
- Container builds and compose config: see `deploy/README.md`
