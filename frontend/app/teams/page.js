'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken, getUser } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

function MemberList({ teamId, refreshKey }) {
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listTeamMembers(teamId).then(setMembers).catch((err) => setError(err.data?.error || err.message));
  }, [teamId, refreshKey]);

  if (error) return <p className="text-xs text-destructive mt-2">{error}</p>;
  if (!members) return <Skeleton className="h-20 w-full mt-3" />;
  if (members.length === 0) return <p className="text-xs text-muted-foreground mt-3 text-center py-4">No members yet.</p>;

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell className="text-muted-foreground">{m.email}</TableCell>
              <TableCell>
                {m.role === 'ADMIN' && (
                  <Badge variant="default" className="text-xs">Admin</Badge>
                )}
                {m.role === 'DEVELOPER' && (
                  <Badge variant="secondary" className="text-xs">Developer</Badge>
                )}
                {m.role === 'VIEWER' && (
                  <Badge variant="outline" className="text-xs">Viewer</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function TeamsPage() {
  const router = useRouter();
  const user = getUser();
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [memberForm, setMemberForm] = useState({ email: '', name: '', password: '', role: 'DEVELOPER' });
  const [addingMember, setAddingMember] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    load();
  }, []);

  async function load() {
    try {
      setTeams(await api.listTeams());
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.createTeam(newTeamName);
      setNewTeamName('');
      await load();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setAddingMember(true);
    setError('');
    try {
      await api.addTeamMember(currentTeamId, memberForm);
      setMemberForm({ email: '', name: '', password: '', role: 'DEVELOPER' });
      setShowAddMember(false);
      setRefreshKey((k) => k + 1);
      await load();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setAddingMember(false);
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-3xl">Teams</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Team members only see applications, analytics, and logs for their own team. Admins see everything
            across the organization regardless of team.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create team</CardTitle>
          <CardDescription>Organize your organization into teams</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="flex gap-3">
            <div className="flex-1">
              <Input
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Support Bot Team"
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create team'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {teams === null ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="pt-16 pb-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">No teams yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first team to organize your organization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {team._count?.members ?? 0} member(s) · {team._count?.applications ?? 0} application(s)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentTeamId(team.id);
                        setShowAddMember(true);
                      }}
                    >
                      Add member
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                    >
                      {expandedTeam === team.id ? 'Hide' : 'View'} members
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedTeam === team.id && (
                <CardContent>
                  <MemberList teamId={team.id} refreshKey={refreshKey} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>
              Add an existing user or create a new one and add them to this team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email</Label>
              <Input
                id="memberEmail"
                type="email"
                required
                value={memberForm.email}
                onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberName">Name (if new user)</Label>
              <Input
                id="memberName"
                value={memberForm.name}
                onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberPassword">Password (if new user)</Label>
              <Input
                id="memberPassword"
                type="password"
                value={memberForm.password}
                onChange={(e) => setMemberForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberRole">Role</Label>
              <Select
                value={memberForm.role}
                onValueChange={(value) => setMemberForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger id="memberRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVELOPER">Developer</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              If the email already has an account in this org, they're just added to this team — name/password are ignored.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddMember(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingMember}>
                {addingMember ? 'Adding…' : 'Add member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
