# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json ./
COPY frontend/package.json ./frontend/
RUN npm install
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# --- Stage 2: Create production runner ---
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY backend/package.json ./backend/
COPY mcp-server/package.json ./mcp-server/
RUN npm install --omit=dev
COPY backend/ ./backend/
COPY mcp-server/ ./mcp-server/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PORT=5000
EXPOSE 5000
CMD ["npm", "start", "--workspace=backend"]
