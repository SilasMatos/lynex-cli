# Linex --- Developer Link Management System

## 📌 Overview

**Linex** is a developer-focused application designed to organize,
manage, and retrieve links efficiently.\
It works as a **local-first knowledge hub** where developers can store
documentation, tutorials, tools, APIs, and references in a structured
way.

The goal is to provide a fast, offline-capable alternative to
traditional bookmark managers and general-purpose tools like Notion ---
optimized specifically for developers.

------------------------------------------------------------------------

## 🎯 Problem

Developers constantly save links across multiple platforms: - Browser
bookmarks - Messaging apps - Notes applications - GitHub stars -
Personal documents

Over time, these resources become fragmented and difficult to retrieve.

------------------------------------------------------------------------

## 💡 Solution

Linex provides a structured environment where links are organized using
folders, subfolders, and metadata, allowing developers to build their
own **Second Brain for Links**.

Key principles: - Instant interaction - Offline-first experience -
Developer-centric organization - Simple and fast UI

------------------------------------------------------------------------

## ⚙️ Core Features (MVP)

-   Create folders and nested structures
-   Add and manage links
-   Title and description support
-   Favorites system
-   Global search
-   Drag-and-drop organization
-   Optimistic UI updates

------------------------------------------------------------------------

## 🧠 Architecture

Linex follows a **Local-First Architecture**.

### Flow

User Action → Local Database → Optimistic UI → Background Sync → Server

### Benefits

-   Instant updates
-   Offline usage
-   Reduced latency
-   Better user experience

------------------------------------------------------------------------

## 🧱 Technology Stack

### Frontend

-   React
-   TanStack Router
-   TanStack Query
-   TanStack DB
-   Tailwind CSS
-   Shadcn UI

### Backend

-   Node.js
-   PostgreSQL
-   REST API

------------------------------------------------------------------------

## 🗄️ Data Model

### Folder

-   id
-   name
-   parentId
-   createdAt
-   updatedAt

### Link

-   id
-   title
-   url
-   description
-   folderId
-   createdAt
-   updatedAt

------------------------------------------------------------------------

## 🔄 Synchronization

Linex uses a mutation queue system: - Local writes happen instantly -
Changes are synchronized asynchronously - Conflict handling through
versioning

------------------------------------------------------------------------

## 🚀 Future Features

-   Automatic link preview
-   Tags and smart filtering
-   Browser extension
-   AI summaries
-   Multi-device synchronization
-   Workspace sharing

------------------------------------------------------------------------

## 🎯 Vision

Linex aims to become the **central knowledge system for developers**,
transforming scattered links into organized, searchable knowledge.

------------------------------------------------------------------------

## 📄 License

To be defined.
