'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/store';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Upload,
  TrendingUp,
} from 'lucide-react';
import { logger } from '@/lib/logger';

interface LtiPlatform {
  id: string;
  name: string;
  issuer: string;
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  keysetUrl: string;
  deploymentId: string;
  publicKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    gradeSyncs: number;
    launchLogs: number;
  };
}

interface GradeSync {
  id: string;
  userId: string;
  lineitemLabel: string;
  score: number;
  scoreMaximum: number;
  status: string;
  syncedAt: string | null;
  createdAt: string;
  user?: { email: string; fullName: string };
}

export default function LtiPlatformManager() {
  const t = useTranslations('ltiPlatform');
  const [platforms, setPlatforms] = useState<LtiPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<LtiPlatform | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [gradeSyncs, setGradeSyncs] = useState<GradeSync[]>([]);
  const [loadingSyncs, setLoadingSyncs] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    clientId: '',
    authUrl: '',
    tokenUrl: '',
    keysetUrl: '',
    deploymentId: '',
    publicKey: '',
    privateKey: '',
  });

  const loadPlatforms = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/lti/platforms', { headers });
      if (res.ok) {
        const data = await res.json();
        setPlatforms(data);
      } else {
        toast.error(t('loadError'));
      }
    } catch (e) {
      logger.warn('LtiPlatformManager loadPlatforms failed', { error: e });
      toast.error(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadGradeSyncs = async (platformId: string) => {
    setLoadingSyncs(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/lti/sync-grades?platformId=${platformId}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setGradeSyncs(data);
      }
    } catch (e) {
      logger.warn('LtiPlatformManager loadGradeSyncs failed', { error: e });
      // ignore
    } finally {
      setLoadingSyncs(false);
    }
  };

  const handleSubmit = async () => {
    const { name, issuer, clientId, authUrl, tokenUrl, keysetUrl, deploymentId } = formData;
    if (!name || !issuer || !clientId || !authUrl || !tokenUrl || !keysetUrl || !deploymentId) {
      toast.error(t('fillRequired'));
      return;
    }

    try {
      const url = editingPlatform ? `/api/lti/platforms/${editingPlatform.id}` : '/api/lti/platforms';
      const method = editingPlatform ? 'PUT' : 'POST';
      const authHeaders = await getAuthHeaders();

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingPlatform ? t('platformUpdated') : t('platformCreated'));
        setShowForm(false);
        setEditingPlatform(null);
        resetForm();
        loadPlatforms();
      } else {
        const error = await res.json();
        toast.error(error.error || t('saveError'));
      }
    } catch (e) {
      logger.warn('LtiPlatformManager handleSubmit failed', { error: e });
      toast.error(t('networkError'));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('confirmDelete', { name }))) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/lti/platforms/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        toast.success(t('platformDeleted'));
        if (selectedPlatformId === id) {
          setSelectedPlatformId(null);
          setGradeSyncs([]);
        }
        loadPlatforms();
      } else {
        toast.error(t('deleteError'));
      }
    } catch (e) {
      logger.warn('LtiPlatformManager handleDelete failed', { error: e });
      toast.error(t('networkError'));
    }
  };

  const handleToggleActive = async (platform: LtiPlatform) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/lti/platforms/${platform.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !platform.isActive }),
      });
      if (res.ok) {
        toast.success(platform.isActive ? t('platformDeactivated') : t('platformActivated'));
        loadPlatforms();
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development')
        logger.warn('LtiPlatformManager handleToggleActive failed', { error: e });
      toast.error(t('networkError'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      issuer: '',
      clientId: '',
      authUrl: '',
      tokenUrl: '',
      keysetUrl: '',
      deploymentId: '',
      publicKey: '',
      privateKey: '',
    });
  };

  const startEdit = (platform: LtiPlatform) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      issuer: platform.issuer,
      clientId: platform.clientId,
      authUrl: platform.authUrl,
      tokenUrl: platform.tokenUrl,
      keysetUrl: platform.keysetUrl,
      deploymentId: platform.deploymentId,
      publicKey: platform.publicKey,
      privateKey: '',
    });
    setShowForm(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copied', { label }));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'failed':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-yellow-500" />;
    }
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <ExternalLink size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold">LMS Integration (LTI 1.3)</h2>
            <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadPlatforms}>
            <RefreshCw size={14} className="mr-1" /> {t('refresh')}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowForm(true);
              resetForm();
              setEditingPlatform(null);
            }}
          >
            <Plus size={14} className="mr-1" /> {t('addPlatform')}
          </Button>
        </div>
      </div>

      {/* Setup Instructions */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="mb-2 text-sm font-semibold">{t('moodleInstructions')}</h3>
          <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-xs">
            <li>
              {t('moodleStep1')} <strong>Site administration → Plugins → Activity modules → External tool</strong>
            </li>
            <li>
              {t('moodleStep2Prefix')} <strong>Configure a preconfigured tool</strong>
            </li>
            <li>
              {t('moodleStep3Prefix')} <strong>Tool URL</strong>:{' '}
              <code className="bg-muted rounded px-1">{appUrl}/api/lti/oidc-login</code>
            </li>
            <li>
              {t('moodleStep4Prefix')} <strong>Issuer, Client ID, Deployment ID</strong> из Moodle {t('moodleStep4Suffix')}
            </li>
            <li>
              {t('moodleStep3Prefix')} <strong>Keyset URL</strong>:{' '}
              <code className="bg-muted rounded px-1">https://your-moodle.com/mod/lti/certs.php</code>
            </li>
            <li>{t('moodleStep6')}</li>
          </ol>
          <div className="mt-3 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>JWKS Endpoint:</strong>{' '}
              <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">{appUrl}/api/lti/jwks</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-semibold">
                  {editingPlatform ? t('editPlatform') : t('newPlatform')}
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium">{t('nameLabel')}</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Moodle"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t('issuerLabel')}</label>
                    <Input
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      placeholder="https://moodle.example.com"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t('clientIdLabel')}</label>
                    <Input
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      placeholder={t('clientIdPlaceholder')}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t('deploymentIdLabel')}</label>
                    <Input
                      value={formData.deploymentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deploymentId: e.target.value,
                        })
                      }
                      placeholder={t('deploymentIdPlaceholder')}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t('authUrlLabel')}</label>
                    <Input
                      value={formData.authUrl}
                      onChange={(e) => setFormData({ ...formData, authUrl: e.target.value })}
                      placeholder="https://moodle.example.com/mod/lti/auth.php"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t('tokenUrlLabel')}</label>
                    <Input
                      value={formData.tokenUrl}
                      onChange={(e) => setFormData({ ...formData, tokenUrl: e.target.value })}
                      placeholder="https://moodle.example.com/mod/lti/token.php"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t('keysetLabel')}</label>
                    <Input
                      value={formData.keysetUrl}
                      onChange={(e) => setFormData({ ...formData, keysetUrl: e.target.value })}
                      placeholder="https://moodle.example.com/mod/lti/certs.php"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">{t('publicKeyLabel')}</label>
                    <Input
                      value={formData.publicKey}
                      onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                      placeholder="-----BEGIN PUBLIC KEY-----"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium">{t('privateKeyLabel')}</label>
                    <div className="relative">
                      <Input
                        type={showPrivateKey ? 'text' : 'password'}
                        value={formData.privateKey}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            privateKey: e.target.value,
                          })
                        }
                        placeholder="-----BEGIN PRIVATE KEY-----"
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2"
                      >
                        {showPrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} size="sm">
                    {editingPlatform ? t('save') : t('create')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPlatform(null);
                      resetForm();
                    }}
                    size="sm"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform List */}
      {loading ? (
        <div className="text-muted-foreground py-8 text-center">{t('loading')}</div>
      ) : platforms.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-muted-foreground p-8 text-center">
            <ExternalLink size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noPlatforms')}</p>
            <p className="mt-1 text-xs">{t('addFirstPlatform')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {platforms.map((p) => (
            <Card key={p.id} className={`border-border ${selectedPlatformId === p.id ? 'border-blue-300' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${p.isActive ? 'bg-green-100' : 'bg-gray-100'}`}
                    >
                      <Shield size={18} className={p.isActive ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{p.name}</p>
                        <Badge variant={p.isActive ? 'default' : 'secondary'} className="text-[10px]">
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{p.issuer}</p>
                      <div className="mt-1 flex gap-3">
                        <span className="text-muted-foreground text-[10px]">Launches: {p._count?.launchLogs || 0}</span>
                        <span className="text-muted-foreground text-[10px]">
                          Grade syncs: {p._count?.gradeSyncs || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPlatformId(selectedPlatformId === p.id ? null : p.id);
                        if (selectedPlatformId !== p.id) loadGradeSyncs(p.id);
                      }}
                    >
                      <TrendingUp size={14} className="mr-1" /> {t('sync')}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)} aria-label="Edit platform">
                      <Pencil size={14} />
                    </Button>
                    <Switch
                      checked={p.isActive}
                      onCheckedChange={() => handleToggleActive(p)}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(p.id, p.name)}
                      aria-label="Delete platform"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Client ID:</span>
                    <code className="bg-muted rounded px-1 text-[10px]">{p.clientId}</code>
                    <button type="button" onClick={() => copyToClipboard(p.clientId, 'Client ID')}>
                      <Copy size={10} className="text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Deployment:</span>
                    <code className="bg-muted rounded px-1 text-[10px]">{p.deploymentId}</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grade Sync Panel */}
      {selectedPlatformId && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Upload size={14} /> {t('gradeSync')}
                </h3>
                <Button variant="outline" size="sm" onClick={() => loadGradeSyncs(selectedPlatformId)}>
                  <RefreshCw size={12} className="mr-1" /> {t('refresh')}
                </Button>
              </div>

              {loadingSyncs ? (
                <div className="text-muted-foreground py-4 text-center">{t('loading')}</div>
              ) : gradeSyncs.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-xs">{t('noSyncRecords')}</p>
              ) : (
                <div className="space-y-1">
                  {gradeSyncs.slice(0, 10).map((sync) => (
                    <div
                      key={sync.id}
                      className="flex items-center justify-between border-b py-2 text-xs last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {statusIcon(sync.status)}
                        <span>{sync.lineitemLabel}</span>
                        {sync.user && <span className="text-muted-foreground">— {sync.user.fullName}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {sync.score}/{sync.scoreMaximum}
                        </span>
                        <Badge
                          variant={
                            sync.status === 'synced'
                              ? 'default'
                              : sync.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {sync.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
