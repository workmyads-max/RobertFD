import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit2, Plus, Search, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPromotions() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percent: 0,
    promotion_type: 'limited_time',
    tag: '🎯 LIMITED OFFER',
    is_active: true,
    display_location: 'welcome_header',
    start_date: '',
    end_date: '',
    cta_text: 'Learn More',
    cta_url: '',
    sort_order: 0,
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: () => base44.entities.Promotion.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Promotion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        discount_percent: 0,
        promotion_type: 'limited_time',
        tag: '🎯 LIMITED OFFER',
        is_active: true,
        display_location: 'welcome_header',
        start_date: '',
        end_date: '',
        cta_text: 'Learn More',
        cta_url: '',
        sort_order: 0,
      });
      toast.success('Promotion created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Promotion.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setEditingId(null);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        discount_percent: 0,
        promotion_type: 'limited_time',
        tag: '🎯 LIMITED OFFER',
        is_active: true,
        display_location: 'welcome_header',
        start_date: '',
        end_date: '',
        cta_text: 'Learn More',
        cta_url: '',
        sort_order: 0,
      });
      toast.success('Promotion updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Promotion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion deleted!');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (promotion) => base44.entities.Promotion.update(promotion.id, { is_active: !promotion.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (promotion) => {
    setFormData(promotion);
    setEditingId(promotion.id);
    setShowForm(true);
  };

  const filteredPromotions = promotions.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Promotions</h1>
          <p className="text-muted-foreground mt-1">Create and manage promotional campaigns</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              description: '',
              discount_percent: 0,
              promotion_type: 'limited_time',
              tag: '🎯 LIMITED OFFER',
              is_active: true,
              display_location: 'welcome_header',
              start_date: '',
              end_date: '',
              cta_text: 'Learn More',
              cta_url: '',
              sort_order: 0,
            });
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> New Promotion
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card rounded-lg border border-border p-6"
          >
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Create'} Promotion</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Get 30% off on your next challenge"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete your KYC verification and unlock exclusive rewards..."
                  rows="3"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Badge Tag</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="🎯 LIMITED OFFER"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">CTA Text</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Learn More"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">CTA URL (optional)</label>
                <input
                  type="url"
                  value={formData.cta_url}
                  onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Type</label>
                  <select
                    value={formData.promotion_type}
                    onChange={(e) => setFormData({ ...formData, promotion_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  >
                    <option value="discount">Discount</option>
                    <option value="bonus">Bonus</option>
                    <option value="special_offer">Special Offer</option>
                    <option value="limited_time">Limited Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Location</label>
                  <select
                    value={formData.display_location}
                    onChange={(e) => setFormData({ ...formData, display_location: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  >
                    <option value="welcome_header">Welcome Header</option>
                    <option value="dashboard">Dashboard</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  id="is_active"
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-semibold">Active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-semibold hover:opacity-80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search promotions..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground outline-none focus:border-primary"
        />
      </div>

      {/* Promotions List */}
      <div className="space-y-2">
        {filteredPromotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No promotions found</p>
          </div>
        ) : (
          filteredPromotions.map((promo) => (
            <motion.div
              key={promo.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start justify-between hover:border-primary/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-bold text-foreground">{promo.title}</h3>
                  {promo.discount_percent > 0 && (
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded font-semibold">
                      {promo.discount_percent}% off
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded font-mono">
                    {promo.promotion_type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{promo.display_location}</span>
                  {promo.start_date && <span>Starts: {new Date(promo.start_date).toLocaleDateString()}</span>}
                  {promo.end_date && <span>Ends: {new Date(promo.end_date).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate(promo)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                  title={promo.is_active ? 'Disable' : 'Enable'}
                >
                  {promo.is_active ? (
                    <Eye className="w-4 h-4 text-green-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(promo)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(promo.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}