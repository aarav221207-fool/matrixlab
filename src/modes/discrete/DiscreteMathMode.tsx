import React, { useState } from 'react';
import {
  analyzeRelation,
  computeSetOperations,
  generateTruthTable,
  calculateCombinatorics,
  RelationAnalysis,
  SetOperationsResult,
  TruthTableResult,
  CombinatoricsResult
} from '../../math/discreteEngine';
import { CalculatorHeader } from '../../components/design-system/CalculatorHeader';
import { ResultPanel } from '../../components/design-system/ResultPanel';
import { StepsPanel } from '../../components/design-system/StepsPanel';
import { Play, CheckCircle2, XCircle } from 'lucide-react';

export const DiscreteMathMode: React.FC = () => {
  const [subTab, setSubTab] = useState<'relations' | 'sets' | 'truth-table' | 'combinatorics'>('relations');

  // Relations state
  const [setAStr, setSetAStr] = useState('1, 2, 3');
  const [relationPairsStr, setRelationPairsStr] = useState('(1,1), (2,2), (3,3), (1,2), (2,1)');
  const [relationResult, setRelationResult] = useState<RelationAnalysis | null>(null);

  // Sets state
  const [set1Str, setSet1Str] = useState('1, 2, 3, 4');
  const [set2Str, setSet2Str] = useState('3, 4, 5, 6');
  const [setResult, setSetResult] = useState<SetOperationsResult | null>(null);

  // Truth table state
  const [logicExpr, setLogicExpr] = useState('(p and q) -> r');
  const [truthResult, setTruthResult] = useState<TruthTableResult | null>(null);

  // Combinatorics state (NEW!)
  const [nItems, setNItems] = useState<number>(8);
  const [rItems, setRItems] = useState<number>(3);
  const [combResult, setCombResult] = useState<CombinatoricsResult | null>(() => {
    try {
      return calculateCombinatorics(8, 3);
    } catch {
      return null;
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const handleAnalyzeRelation = () => {
    setError(null);
    try {
      const setA = setAStr.split(/[\s,]+/).filter(Boolean);
      const pairMatches = relationPairsStr.match(/\(([^,)]+),\s*([^)]+)\)/g);
      if (!pairMatches) throw new Error('No pairs found. Format as (a, b), (c, d)');

      const pairs: [string, string][] = pairMatches.map(p => {
        const clean = p.replace(/[()]/g, '').split(',');
        return [clean[0].trim(), clean[1].trim()];
      });

      const res = analyzeRelation(setA, pairs);
      setRelationResult(res);
    } catch (e: any) {
      setError(e.message);
      setRelationResult(null);
    }
  };

  const handleComputeSets = () => {
    setError(null);
    try {
      const sA = set1Str.split(/[\s,]+/).filter(Boolean);
      const sB = set2Str.split(/[\s,]+/).filter(Boolean);
      const res = computeSetOperations(sA, sB);
      setSetResult(res);
    } catch (e: any) {
      setError(e.message);
      setSetResult(null);
    }
  };

  const handleGenerateTruth = () => {
    setError(null);
    try {
      const res = generateTruthTable(logicExpr);
      setTruthResult(res);
    } catch (e: any) {
      setError(e.message);
      setTruthResult(null);
    }
  };

  const handleComputeComb = () => {
    setError(null);
    try {
      const res = calculateCombinatorics(nItems, rItems);
      setCombResult(res);
    } catch (e: any) {
      setError(e.message);
      setCombResult(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <CalculatorHeader
        category="Discrete Mathematics"
        title="Discrete Mathematics & Logic"
        description="Verify binary relation properties (reflexive, symmetric, transitive, equivalence classes), set-theoretic algebra, propositional logic truth tables, and combinatorial counting."
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'relations', label: 'Binary Relations' },
          { id: 'sets', label: 'Set Operations' },
          { id: 'truth-table', label: 'Truth Table Generator' },
          { id: 'combinatorics', label: 'Combinatorics (nPr, nCr)' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setSubTab(t.id as any);
              setError(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              subTab === t.id
                ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* 1. Relations Tab */}
      {subTab === 'relations' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Set A Elements</label>
              <input
                type="text"
                value={setAStr}
                onChange={e => setSetAStr(e.target.value)}
                placeholder="1, 2, 3"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Relation Pairs R ⊆ A × A</label>
              <input
                type="text"
                value={relationPairsStr}
                onChange={e => setRelationPairsStr(e.target.value)}
                placeholder="(1,1), (2,2), (3,3), (1,2)"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyzeRelation}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Analyze Relation Properties</span>
          </button>

          {relationResult && (
            <>
              <ResultPanel
                title="RELATION CLASSIFICATION"
                result={
                  relationResult.isEquivalence
                    ? 'Equivalence Relation'
                    : relationResult.isPartialOrder
                    ? 'Partial Order (Poset)'
                    : 'Standard Binary Relation'
                }
                subtitle={`Domain has ${relationResult.domain.length} elements, Range has ${relationResult.range.length} elements`}
                badge={relationResult.isEquivalence ? 'Equivalence' : 'Non-Equivalence'}
                secondaryResults={[
                  { label: 'Reflexive', value: relationResult.isReflexive ? 'Yes' : 'No' },
                  { label: 'Symmetric', value: relationResult.isSymmetric ? 'Yes' : 'No' },
                  { label: 'Transitive', value: relationResult.isTransitive ? 'Yes' : 'No' },
                  { label: 'Antisymmetric', value: relationResult.isAntisymmetric ? 'Yes' : 'No' }
                ]}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Relation Axiom Verifications & Counterexamples"
                  steps={relationResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 2. Sets Tab */}
      {subTab === 'sets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Set A</label>
              <input
                type="text"
                value={set1Str}
                onChange={e => setSet1Str(e.target.value)}
                placeholder="1, 2, 3, 4"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Set B</label>
              <input
                type="text"
                value={set2Str}
                onChange={e => setSet2Str(e.target.value)}
                placeholder="3, 4, 5, 6"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleComputeSets}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Compute Set Operations</span>
          </button>

          {setResult && (
            <>
              <ResultPanel
                title="SET THEORETIC OPERATIONS"
                result={`A ∪ B = { ${setResult.union.join(', ')} }`}
                subtitle={`Cardinality: |A ∪ B| = ${setResult.union.length}`}
                secondaryResults={[
                  { label: 'Intersection A ∩ B', value: `{ ${setResult.intersection.join(', ') || '∅'} }` },
                  { label: 'Difference A \\ B', value: `{ ${setResult.differenceAB.join(', ') || '∅'} }` },
                  { label: 'Sym. Difference A Δ B', value: `{ ${setResult.symmetricDifference.join(', ') || '∅'} }` },
                  { label: 'Cartesian Pairs', value: setResult.cartesianProduct.length }
                ]}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Set Derivation & Membership Axioms"
                  steps={setResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 3. Truth Table Tab */}
      {subTab === 'truth-table' && (
        <div className="space-y-6">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Boolean Propositional Formula</label>
            <input
              type="text"
              value={logicExpr}
              onChange={e => setLogicExpr(e.target.value)}
              placeholder="(p and q) -> r, p or not q, p <-> q"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Supports operators: and (∧), or (∨), not (¬), -&gt; (implies), &lt;-&gt; (iff), xor
            </p>
          </div>

          <button
            onClick={handleGenerateTruth}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Generate Truth Table</span>
          </button>

          {truthResult && (
            <div className="space-y-6">
              <ResultPanel
                title="LOGICAL CLASSIFICATION"
                result={truthResult.classification}
                subtitle={`Evaluation of ${truthResult.expression} across 2^${truthResult.variables.length} = ${truthResult.rows.length} truth assignments`}
                badge={truthResult.classification.split(' ')[0]}
              />

              {/* Truth Table Grid */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <table className="w-full text-left text-sm font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      {truthResult.variables.map(v => (
                        <th key={v} className="py-2.5 px-4">{v}</th>
                      ))}
                      <th className="py-2.5 px-4 text-blue-400 font-bold">{truthResult.expression}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {truthResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        {truthResult.variables.map(v => (
                          <td key={v} className="py-2 px-4">
                            <span className={row.assignment[v] ? 'text-green-400 font-bold' : 'text-slate-500'}>
                              {row.assignment[v] ? 'T' : 'F'}
                            </span>
                          </td>
                        ))}
                        <td className="py-2 px-4 font-bold">
                          <span className={row.result ? 'text-green-400' : 'text-red-400'}>
                            {row.result ? 'T (True)' : 'F (False)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Combinatorics Tab (NEW!) */}
      {subTab === 'combinatorics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Total Items (n)</label>
              <input
                type="number"
                value={nItems}
                onChange={e => setNItems(parseInt(e.target.value) || 0)}
                min="0"
                max="25"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Items to Choose (r)</label>
              <input
                type="number"
                value={rItems}
                onChange={e => setRItems(parseInt(e.target.value) || 0)}
                min="0"
                max={nItems}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleComputeComb}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Calculate Combinatorics</span>
          </button>

          {combResult && (
            <>
              <ResultPanel
                title="COMBINATIONS & PERMUTATIONS"
                result={`C(${combResult.n}, ${combResult.r}) = ${combResult.combinations_nCr}`}
                subtitle={`Permutations (order matters) P(${combResult.n}, ${combResult.r}) = ${combResult.permutations_nPr}`}
                secondaryResults={[
                  { label: 'nCr (Combinations)', value: combResult.combinations_nCr },
                  { label: 'nPr (Permutations)', value: combResult.permutations_nPr },
                  { label: 'n! (Factorial)', value: combResult.factorialN },
                  { label: '2ⁿ (Power Set)', value: combResult.subsets2n }
                ]}
                showSteps={showSteps}
                onToggleSteps={() => setShowSteps(!showSteps)}
              />

              {showSteps && (
                <StepsPanel
                  title="Factorial Derivation & Combinatorial Identities"
                  steps={combResult.steps}
                  defaultOpen={true}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
