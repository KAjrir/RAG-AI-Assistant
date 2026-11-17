import { useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getErrorMessage } from "../../lib/utils.js";

// Pas de features hier aan zodra je de limieten in de backend vastlegt
const PLANS = [
	{
		key: "free",
		name: "Basis",
		description: "Om Raggy rustig uit te proberen met je team.",
		features: [
			"Chatten met je eigen documenten",
			"Beperkt aantal documenten",
			"Beperkt aantal teamleden",
			"Openbare connecties",
		],
	},
	{
		key: "pro",
		name: "Pro",
		description: "Alles van Raggy, zonder limieten.",
		features: [
			"Alles uit Basis",
			"Onbeperkt documenten",
			"Onbeperkt teamleden",
			"Alle connecties",
		],
	},
];

export default function Abonnement() {
	const { workspace, activatePlan } = useWorkspace();
	const toast = useToast();

	const currentPlan = workspace?.plan ?? "free";
	const isPro = currentPlan === "pro";

	const [code, setCode] = useState("");
	const [showCode, setShowCode] = useState(false);
	const [activating, setActivating] = useState(false);
	const [activated, setActivated] = useState(false);

	async function handleActivate(e) {
		e.preventDefault();
		if (!code.trim()) return;
		setActivating(true);
		try {
			await activatePlan(code.trim());
			setCode("");
			setActivated(true);
			toast.success("Pro is geactiveerd voor deze workspace.");
		} catch (err) {
			toast.error(getErrorMessage(err, "Deze code is ongeldig."));
		} finally {
			setActivating(false);
		}
	}

	return (
		<>
			{/* ── Plannen ── */}
			<section className="is-section">
				<h2 className="is-section-title">Plannen</h2>
				<div className="is-plans">
					{PLANS.map((plan) => {
						const isCurrent = plan.key === currentPlan;
						return (
							<div
								key={plan.key}
								className={`is-plan ${isCurrent ? "is-plan--current" : ""} ${plan.key === "pro" ? "is-plan--pro" : ""}`}
							>
								<div className="is-plan-header">
									<span className="is-plan-name">
										{plan.name}
									</span>
									{isCurrent && (
										<span className="is-plan-badge">
											Huidig plan
										</span>
									)}
								</div>
								<p className="is-plan-desc">
									{plan.description}
								</p>
								<ul className="is-plan-features">
									{plan.features.map((feature) => (
										<li
											key={feature}
											className="is-plan-feature"
										>
											<CheckIcon /> {feature}
										</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>
			</section>

			{/* ── Activeren ── */}
			<section className="is-section">
				<h2 className="is-section-title">
					{isPro ? "Status" : "Pro activeren"}
				</h2>

				{isPro ? (
					<div className="is-plan-active">
						<CheckIcon />
						<div>
							<p className="is-plan-active-title">
								{activated
									? "Pro is geactiveerd"
									: "Pro is actief"}
							</p>
							<p className="is-plan-active-sub">
								Alle functies van Raggy zijn beschikbaar voor
								deze workspace.
							</p>
						</div>
					</div>
				) : (
					<form className="is-form" onSubmit={handleActivate}>
						<div className="is-field">
							<label className="is-label" htmlFor="plan-code">
								Activeringscode
							</label>
							<div className="is-code-wrap">
								<input
									id="plan-code"
									className="is-input is-code-input"
									type={showCode ? "text" : "password"}
									value={code}
									onChange={e => setCode(e.target.value)}
									placeholder="Plak hier je code"
									autoComplete="off"
									spellCheck={false}
								/>
								<button
									type="button"
									className="is-code-toggle"
									onClick={() => setShowCode((p) => !p)}
									tabIndex={-1}
									aria-label={
										showCode
											? "Code verbergen"
											: "Code tonen"
									}
								>
									{showCode ? <EyeOffIcon /> : <EyeIcon />}
								</button>
							</div>
							<p className="is-field-hint">
								Heb je een code van ons gekregen? Vul hem hier
								in om Pro te activeren.
							</p>
						</div>

						<div className="is-form-footer">
							<button
								type="submit"
								className="is-btn-primary"
								disabled={activating || !code.trim()}
							>
								{activating ? "Activeren…" : "Activeren"}
							</button>
						</div>
					</form>
				)}
			</section>
		</>
	);
}

function CheckIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
			<path
				d="M2 7.5l3 3L12 3"
				stroke="currentColor"
				strokeWidth="1.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function EyeIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path
				d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinejoin="round"
			/>
			<circle
				cx="8"
				cy="8"
				r="2"
				stroke="currentColor"
				strokeWidth="1.3"
			/>
		</svg>
	);
}

function EyeOffIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path
				d="M2 2l12 12"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
			<path
				d="M6.5 6.6A2 2 0 0 0 9.4 9.5"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
			<path
				d="M4.2 4.3C2.8 5.2 1.7 6.7 1 8c1 2 3.5 5 7 5a7 7 0 0 0 3.7-1.1"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
			<path
				d="M12.5 10.8C13.6 9.8 14.4 8.8 15 8c-1-2-3.5-5-7-5a7 7 0 0 0-2 .3"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
		</svg>
	);
}
