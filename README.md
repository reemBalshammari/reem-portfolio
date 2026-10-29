# Reem Portfolio — Full-Stack CMS

A bilingual, responsive portfolio built to present my projects, technical experience, certifications, and professional background through a custom content management system.

🔗 **Live Website:** https://reem-portfolio-one.vercel.app

## Overview

This project goes beyond a static portfolio. It includes a secure administration dashboard that allows portfolio content to be managed without modifying the source code.

The website supports Arabic and English, light and dark themes, responsive layouts, project galleries, and a fully functional contact system.

## Technical Architecture

```mermaid
flowchart LR
    A[Portfolio UI] --> B[Vercel Functions]
    B --> C[Supabase Database]
    B --> D[Resend API]
    E[Admin Dashboard] --> F[Supabase Auth]
    F --> C
