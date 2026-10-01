# Rule: Instant Loading & No Delays
**Description**: The user absolutely requires that the entire application loads instantly with zero perceived delay. This applies to all images, animations, icons, and components.

## Guidelines
1. **Images**:
   - MUST use `loading="eager"` on all above-the-fold or critical images.
   - MUST use `fetchPriority="high"` on critical visual elements like backgrounds and hero images.
   - DO NOT use lazy loading for primary assets.
2. **Animations**:
   - Animations MUST begin immediately upon component mount.
   - DO NOT use entry delays, `setTimeout` wrappers, or staggered load-in effects unless explicitly requested. 
   - Never implement "loading" states if the data can be resolved instantly or if it blocks critical visual presentation.
3. **Icons & Assets**:
   - Must be bundled efficiently or inline to avoid network waterfall delays.
   - Must render instantly with the page structure.
4. **General**:
   - Avoid slow, fading-in components if they cause the user to perceive the site as slow or lagging.
   - The application should always feel lightning-fast and extremely responsive. "Instantly need to come" is the core principle.
