/**
 * Component naming conventions and patterns
 * 
 * File Organization:
 * - components/
 *   ├── ui/           - Reusable UI components (Button, Card, Dialog, etc.)
 *   ├── common/       - Common shared components (Header, Footer, etc.)
 *   ├── features/     - Feature-specific components
 *   │   ├── dashboard/
 *   │   ├── analysis/
 *   │   ├── admin/
 *   │   └── auth/
 *   ├── layout/       - Layout wrapper components
 *   └── error/        - Error boundary and error components
 * 
 * Component Naming:
 * - PascalCase for component files: Button.jsx, UserProfile.jsx
 * - Export as named export: export function Button() {}
 * - For wrapper components, use: export default ComponentName
 * 
 * Props Pattern:
 * - Use destructuring for props
 * - Define propTypes or TypeScript interfaces
 * - Provide default values for optional props
 * - Use spread operator for forwarding HTML attributes
 * 
 * Hooks Best Practices:
 * - Custom hooks should start with "use"
 * - Keep hooks focused on single responsibility
 * - Use useCallback for memoization
 * - Clean up side effects in useEffect
 * 
 * File Structure Example:
 * 
 * // UserCard.jsx
 * import PropTypes from 'prop-types';
 * 
 * function UserCard({ user, onDelete, className, ...props }) {
 *   return (
 *     <div className={`user-card ${className}`} {...props}>
 *       <h3>{user.name}</h3>
 *       <p>{user.email}</p>
 *       <button onClick={() => onDelete(user.id)}>Delete</button>
 *     </div>
 *   );
 * }
 * 
 * UserCard.propTypes = {
 *   user: PropTypes.shape({
 *     id: PropTypes.string.isRequired,
 *     name: PropTypes.string.isRequired,
 *     email: PropTypes.string.isRequired,
 *   }).isRequired,
 *   onDelete: PropTypes.func.isRequired,
 *   className: PropTypes.string,
 * };
 * 
 * UserCard.defaultProps = {
 *   className: '',
 * };
 * 
 * export default UserCard;
 */
