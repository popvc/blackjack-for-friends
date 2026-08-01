import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import "./style.css"

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
//TODOS:
//  need dedicated page for error response codes
//  auth status when connected, redirected off signin/signup pages automatically and vice versa
//  on the serverside, currently if a socketevent happens, it relies on an http response to update for the user taking the action.
//However, if the user is connected on multiple sockets those other sockets on receive the updated UI. Fairly easy fix to emit to the
//performing the action too, just not important right now.
//  

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}