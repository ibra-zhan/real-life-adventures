import { useAuthContext } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthTest() {
  const { isAuthenticated, user: authUser, login, logout, isLoading } = useAuthContext();
  const { state: userState } = useUser();

  const handleTestLogin = async () => {
    try {
      await login({
        email: 'test@example.com',
        password: 'TestPass123'
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        </div>
        
        {authUser && (
          <div>
            <p><strong>User ID:</strong> {authUser.id}</p>
            <p><strong>Username:</strong> {authUser.username}</p>
            <p><strong>Email:</strong> {authUser.email}</p>
            <p><strong>Level:</strong> {authUser.level}</p>
            <p><strong>XP:</strong> {authUser.xp}</p>
          </div>
        )}

        {userState.user && (
          <div>
            <p><strong>UserContext User:</strong> {userState.user.username}</p>
            <p><strong>UserContext Level:</strong> {userState.user.level}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isAuthenticated ? (
            <Button onClick={handleTestLogin} disabled={isLoading}>
              Test Login
            </Button>
          ) : (
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
