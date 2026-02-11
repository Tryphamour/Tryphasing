### Implementation Phase - Part 2.2: Frontend Card Management (2026-02-11)

This run file details the implementation of the Card Management feature within the Frontend Admin Interface.

**Goals for this Run:**
*   Extend `frontend/src/services/api.ts` to handle backend REST API calls for Cards.
*   Implement `frontend/src/pages/Admin/CardManagement.tsx` for listing and creating cards.
*   Integrate Card Management into the frontend routing.

**Detailed Steps:**

**1. Extend `frontend/src/services/api.ts`:**
    *   Create `getCards` function to fetch all cards from the backend.
    *   Create `createCard` function to send new card data to the backend.
    *   (Optional, but helpful): Add `getSets` to `api.ts` if not already there, as cards need to be associated with sets.

**2. Implement `frontend/src/pages/Admin/CardManagement.tsx`:**
    *   Use React hooks (`useState`, `useEffect`) to manage the list of cards and form input.
    *   Fetch cards on component mount using `api.getCards`.
    *   Fetch available sets to allow association of cards with sets.
    *   Display the fetched cards in a user-friendly table or list.
    *   Create a form for users to input `name`, `description`, `image` (URL), `rarity`, and `setId` for new cards.
    *   `Rarity` should be a dropdown populated from the `Rarity` enum (which can be hardcoded or fetched from backend if an endpoint exists).
    *   `SetId` should be a dropdown populated with fetched sets.
    *   Handle form submission to call `api.createCard` and update the list of cards upon successful creation.
    *   Include basic error handling and loading states.

**3. Integrate Card Management into Frontend Routing:**
    *   Modify `frontend/src/router.tsx` to add a nested route for `/admin/cards` that renders `CardManagement.tsx`.
    *   `AdminLayout.tsx` already has a navigation link for `/admin/cards`.

**Verification Steps for this Run:**
*   The frontend application (`npm run dev` in `frontend/`) starts successfully.
*   Navigating to `/admin/cards` displays the `CardManagement` component.
*   The list of cards is fetched from the backend (if any exist from seeding) and displayed.
*   The dropdowns for Rarity and Set are correctly populated.
*   A new card can be created successfully via the form, associated with an existing set and rarity, and it appears in the list after creation.
*   Error messages are displayed appropriately if API calls fail.

**Risks:**
*   API integration issues (CORS, incorrect endpoint paths).
*   Handling of `Rarity` enum and `setId` selection in forms.
*   Frontend rendering issues with complex forms.
*   Image handling (currently just URL strings).

**Completion Summary:**
All outlined steps for the "Frontend Card Management" phase have been successfully completed.

1.  **Extended `frontend/src/services/api.ts`:**
    *   Added `Card` and `CreateCardPayload` interfaces.
    *   Added `getCards` and `createCard` functions to interact with the backend API.
    *   Corrected `Rarity` enum typo.
2.  **Implemented `frontend/src/pages/Admin/CardManagement.tsx`:**
    *   Created the React component to list existing cards, display loading and error states.
    *   Fetches both cards and sets (for association).
    *   Provides a form for creating new cards including fields for name, description, image URL, rarity (dropdown), and set (dropdown).
    *   Successfully uses the `api.ts` service for data fetching and submission.
3.  **Integrated Card Management into Frontend Routing:**
    *   `frontend/src/router.tsx` was updated to define the nested route `/admin/cards` for `CardManagement.tsx`.
    *   `frontend/src/pages/Admin/AdminLayout.tsx` already had the navigation link for "Cards".

This phase provides a functional admin interface for managing cards, demonstrating successful integration with the backend API and frontend routing, and allowing association with existing sets.