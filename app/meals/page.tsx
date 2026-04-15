'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type ShoppingItem = { id: string; name: string; quantity: string; category: string; checked: boolean }
type Recipe = { id: string; title: string; ingredients: string; instructions: string; prep_time: string }

export default function MealsPage() {
  const [tab, setTab] = useState<'shopping' | 'recipes'>('shopping')
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [itemInput, setItemInput] = useState('')
  const [smartText, setSmartText] = useState('')
  const [smartLoading, setSmartLoading] = useState(false)
  const [recipePrompt, setRecipePrompt] = useState('')
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  useEffect(() => { loadItems(); loadRecipes() }, [])

  async function loadItems() {
    const { data } = await supabase.from('shopping_items').select('*').order('created_at', { ascending: false })
    if (data) setItems(data)
  }

  async function loadRecipes() {
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
    if (data) setRecipes(data)
  }

  async function addItem() {
    if (!itemInput.trim()) return
    await supabase.from('shopping_items').insert({
      name: itemInput.trim(),
      quantity: '1',
      category: 'Other',
      checked: false,
      user_profile: 'mom',
    })
    setItemInput('')
    loadItems()
  }

  async function smartAdd() {
    if (!smartText.trim()) return
    setSmartLoading(true)
    try {
      const res = await fetch('/api/smart-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: smartText }),
      })
      const parsed = await res.json()
      for (const item of parsed.items ?? []) {
        await supabase.from('shopping_items').insert({
          name: item.name,
          quantity: item.quantity ?? '1',
          category: item.category ?? 'Other',
          checked: false,
          user_profile: 'mom',
        })
      }
      setSmartText('')
      loadItems()
    } catch {
      alert('Smart add failed')
    }
    setSmartLoading(false)
  }

  async function toggleItem(item: ShoppingItem) {
    await supabase.from('shopping_items').update({ checked: !item.checked }).eq('id', item.id)
    loadItems()
  }

  async function deleteItem(id: string) {
    await supabase.from('shopping_items').delete().eq('id', id)
    loadItems()
  }

  async function generateRecipe() {
    if (!recipePrompt.trim()) return
    setRecipeLoading(true)
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: recipePrompt }),
      })
      const recipe = await res.json()
      if (recipe.error) throw new Error(recipe.error)
      if (!recipe.title) throw new Error('No recipe returned')
      // Strip prep_time to just a string (some tables store it as integer)
      const prepTime = String(recipe.prep_time ?? '').replace(/[^0-9]/g, '') || null
      const { error: dbError } = await supabase.from('recipes').insert({
        title: recipe.title,
        ingredients: recipe.ingredients ?? '',
        instructions: recipe.instructions ?? '',
        prep_time: prepTime,
        user_profile: 'mom',
      })
      if (dbError) throw new Error(dbError.message)
      setRecipePrompt('')
      loadRecipes()
    } catch (e: unknown) {
      alert('Recipe generation failed: ' + (e instanceof Error ? e.message : String(e)))
    }
    setRecipeLoading(false)
  }

  async function deleteRecipe(id: string) {
    if (!confirm('Delete this recipe?')) return
    await supabase.from('recipes').delete().eq('id', id)
    loadRecipes()
  }

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">Meals</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Shopping list and recipe book</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--surface-alt)] rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setTab('shopping')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'shopping' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-sub)]'
            }`}
          >
            🛒 Shopping
          </button>
          <button
            onClick={() => setTab('recipes')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'recipes' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-sub)]'
            }`}
          >
            📖 Recipes
          </button>
        </div>

        {/* Shopping tab */}
        {tab === 'shopping' && (
          <div>
            {/* Quick add */}
            <div className="flex gap-2 mb-4">
              <input
                value={itemInput}
                onChange={e => setItemInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="Add item..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white"
              />
              <button
                onClick={addItem}
                className="px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90"
              >
                Add
              </button>
            </div>

            {/* Smart add */}
            <div className="bg-white rounded-2xl border border-[var(--border)] p-4 mb-5">
              <div className="text-xs font-semibold text-[var(--accent)] mb-2">✦ Smart Add with AI</div>
              <div className="flex gap-2">
                <input
                  value={smartText}
                  onChange={e => setSmartText(e.target.value)}
                  placeholder='e.g. "2 gallons milk, dozen eggs, sourdough bread"'
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  onClick={smartAdd}
                  disabled={smartLoading}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                >
                  {smartLoading ? 'Parsing...' : 'Parse'}
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5">
              {unchecked.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleItem(item)}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--text)]">{item.name}</span>
                    {item.quantity !== '1' && <span className="text-xs text-[var(--text-muted)] ml-2">{item.quantity}</span>}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{item.category}</span>
                  <button onClick={() => deleteItem(item.id)} className="text-[var(--text-muted)] hover:text-red-500 text-sm">✕</button>
                </div>
              ))}

              {checked.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-[var(--text-muted)] mb-2 px-1">CHECKED OFF</div>
                  {checked.map(item => (
                    <div key={item.id} className="bg-[var(--surface-alt)] rounded-xl px-4 py-3 flex items-center gap-3 mb-1.5 opacity-60">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleItem(item)}
                        className="w-4 h-4 accent-[var(--accent)]"
                      />
                      <span className="flex-1 text-sm line-through text-[var(--text-muted)]">{item.name}</span>
                      <button onClick={() => deleteItem(item.id)} className="text-[var(--text-muted)] hover:text-red-500 text-sm">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-12 text-[var(--text-muted)]">
                  <div className="text-4xl mb-3">🛒</div>
                  <p className="font-medium">Shopping list is empty</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recipes tab */}
        {tab === 'recipes' && (
          <div>
            {/* AI generator */}
            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-5">
              <div className="text-sm font-semibold text-[var(--text)] mb-1">✦ Generate AI Recipe</div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Describe what you want to make or what ingredients you have</p>
              <div className="flex gap-2">
                <input
                  value={recipePrompt}
                  onChange={e => setRecipePrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateRecipe()}
                  placeholder='e.g. "Quick chicken dinner with lemon and herbs"'
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  onClick={generateRecipe}
                  disabled={recipeLoading}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                >
                  {recipeLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            {/* Recipe modal */}
            {selectedRecipe && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[var(--text)]">{selectedRecipe.title}</h2>
                    <button onClick={() => setSelectedRecipe(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] text-xl">✕</button>
                  </div>
                  {selectedRecipe.prep_time && <div className="text-xs text-[var(--text-muted)] mb-4">⏱ {selectedRecipe.prep_time}</div>}
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-[var(--text)] mb-2">Ingredients</h3>
                    <p className="text-sm text-[var(--text-sub)] whitespace-pre-line">{selectedRecipe.ingredients}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--text)] mb-2">Instructions</h3>
                    <p className="text-sm text-[var(--text-sub)] whitespace-pre-line">{selectedRecipe.instructions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipe list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="bg-white rounded-xl border border-[var(--border)] p-4 cursor-pointer hover:border-[var(--accent)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[var(--text)] truncate">{recipe.title}</div>
                      {recipe.prep_time && <div className="text-xs text-[var(--text-muted)] mt-0.5">⏱ {recipe.prep_time}</div>}
                      <div className="text-xs text-[var(--accent)] mt-1">✦ AI</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteRecipe(recipe.id) }}
                      className="text-[var(--text-muted)] hover:text-red-500 text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {recipes.length === 0 && (
                <div className="col-span-2 text-center py-12 text-[var(--text-muted)]">
                  <div className="text-4xl mb-3">📖</div>
                  <p className="font-medium">No recipes yet</p>
                  <p className="text-sm mt-1">Generate your first recipe above</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
