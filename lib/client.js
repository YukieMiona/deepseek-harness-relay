window.__ModuleLoader__.load({ id: "dsh-relay", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);
let react = require("react");
react = __toESM(react);

//#region \0dsh-relay-css:D:\LabTeto\deepseek-harness-mobile-plugin\src\client\RelayCard.module.css.mjs
const css = ".rG3tca_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.rG3tca_card:hover{border-color:var(--dsw-alias-label-dimmed)}.rG3tca_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.rG3tca_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.rG3tca_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.rG3tca_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.rG3tca_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.rG3tca_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.rG3tca_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.rG3tca_chevronOpen{transform:rotate(180deg)}.rG3tca_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.rG3tca_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.rG3tca_readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}.rG3tca_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.rG3tca_field+.rG3tca_field{border-top:1px solid var(--dsw-alias-border-l2)}.rG3tca_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.rG3tca_value{color:var(--dsw-alias-label-secondary);word-break:break-word;font-size:13px;line-height:1.5}.rG3tca_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.rG3tca_segmented{flex-wrap:wrap;gap:8px;display:flex}.rG3tca_segment{appearance:none;border:1px solid var(--dsw-alias-border-l2);height:28px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:14px;padding:0 12px;font-size:12px;line-height:18px;transition:background .16s,border-color .16s}.rG3tca_segment:hover:not(:disabled):not(.rG3tca_segmentOn){background:var(--dsw-alias-interactive-bg-hover)}.rG3tca_segment:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.rG3tca_segment:disabled{cursor:default;opacity:.4}.rG3tca_segmentOn{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-static-neutral-bluish-400)}.rG3tca_actions{border-top:1px solid var(--dsw-alias-border-l2);flex-wrap:wrap;gap:8px;padding:12px 0;display:flex}.rG3tca_action{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:8px;align-items:center;padding:5px 14px;font-size:13px;line-height:1.5;text-decoration:none;transition:color .16s,border-color .16s;display:inline-flex}.rG3tca_action:hover,.rG3tca_action:focus-visible{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed);text-decoration:none}.rG3tca_footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}.rG3tca_failed{min-width:0;color:var(--dsw-alias-state-error-primary);flex:1;margin:0;font-size:12px;line-height:1.5}.rG3tca_discard,.rG3tca_save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}.rG3tca_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.rG3tca_discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.rG3tca_save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}.rG3tca_discard:disabled,.rG3tca_save:disabled{opacity:.4;cursor:default}.rG3tca_discard:focus-visible,.rG3tca_save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.rG3tca_warn{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label);border-radius:8px;margin-top:12px;padding:8px 12px;font-size:13px;line-height:20px}.rG3tca_loading{color:var(--dsw-alias-label-tertiary);margin:0;padding:14px 16px;font-size:12px;line-height:18px}";
const tagId = "dsh-relay/RelayCard.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-relay";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var RelayCard_module_css_default = {
	"warn": "rG3tca_warn",
	"loading": "rG3tca_loading",
	"name": "rG3tca_name",
	"field": "rG3tca_field",
	"description": "rG3tca_description",
	"cardOpen": "rG3tca_cardOpen",
	"pending": "rG3tca_pending",
	"label": "rG3tca_label",
	"headText": "rG3tca_headText",
	"card": "rG3tca_card",
	"segmentOn": "rG3tca_segmentOn",
	"actions": "rG3tca_actions",
	"action": "rG3tca_action",
	"discard": "rG3tca_discard",
	"readOnly": "rG3tca_readOnly",
	"footer": "rG3tca_footer",
	"segmented": "rG3tca_segmented",
	"failed": "rG3tca_failed",
	"header": "rG3tca_header",
	"chevronOpen": "rG3tca_chevronOpen",
	"hint": "rG3tca_hint",
	"body": "rG3tca_body",
	"chevron": "rG3tca_chevron",
	"segment": "rG3tca_segment",
	"save": "rG3tca_save",
	"value": "rG3tca_value"
};

//#endregion
//#region lib/types/client/RelayCard.js
/** The switches, in the order a person reasons about them. */
const CHOICES = [
	{
		field: "privilegedMethods",
		label: "Configuration access for remote clients",
		hint: "The harness serves settings, credentials, model discovery, and its directory pickers only to the machine it runs on. This decides whether an authenticated remote client reaches them too. Clients admitted by network address never do.",
		options: [{
			value: "allow-authenticated",
			label: "Allow once authenticated"
		}, {
			value: "loopback-only",
			label: "This machine only"
		}]
	},
	{
		field: "uiLink",
		label: "Relay link in this UI",
		hint: "The small link in the corner that reaches the relay pages.",
		options: [{
			value: "true",
			label: "Shown"
		}, {
			value: "false",
			label: "Hidden"
		}]
	},
	{
		field: "mdns",
		label: "Announce on the local network",
		hint: "Publishes _dsh._tcp so a client can find this relay without scanning the subnet.",
		options: [{
			value: "true",
			label: "Announced"
		}, {
			value: "false",
			label: "Quiet"
		}]
	}
];
/** Parse the string a control carries back into the value the field holds. */
function parseChoice(field, raw) {
	if (field === "privilegedMethods") return raw;
	return raw === "true";
}
/** Render the value currently in effect for one choice. */
function currentChoice(field, value) {
	if (field === "privilegedMethods") return value?.privilegedMethods ?? "allow-authenticated";
	if (field === "uiLink") return String(value?.uiLink ?? true);
	return String(value?.mdns ?? true);
}
/**
* The chevron the neighbouring card headers use, drawn here rather than
* imported: the icon set is a module-table row, but depending on it would pin
* this plugin to one harness release for one path.
* @param props.className - the rotation class the header applies.
* @returns the 14px glyph.
*/
function Chevron(props) {
	return (0, react_jsx_runtime.jsx)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		fill: "none",
		className: props.className,
		"aria-hidden": "true",
		children: (0, react_jsx_runtime.jsx)("path", {
			d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
			fill: "currentColor"
		})
	});
}
/**
* Render the relay's configuration card.
* @param props - the bound snapshot hook and the field writer.
* @returns the card.
*/
function RelayCard(props) {
	const snapshot = props.useRelayCard((current) => current);
	const [open, setOpen] = (0, react.useState)(false);
	const [drafts, setDrafts] = (0, react.useState)({});
	const [saving, setSaving] = (0, react.useState)(false);
	const [failed, setFailed] = (0, react.useState)(false);
	const value = snapshot.value;
	const readOnly = !snapshot.writable;
	if (snapshot.status === "loading") return (0, react_jsx_runtime.jsx)("li", {
		className: RelayCard_module_css_default.card,
		children: (0, react_jsx_runtime.jsx)("p", {
			className: RelayCard_module_css_default.loading,
			children: "Loading the relay configuration…"
		})
	});
	const selected = (field) => drafts[field] ?? currentChoice(field, value);
	const dirty = CHOICES.some((choice) => selected(choice.field) !== currentChoice(choice.field, value));
	const stage = (field, raw) => {
		setFailed(false);
		setDrafts((current) => ({
			...current,
			[field]: raw
		}));
	};
	const save = () => {
		setSaving(true);
		setFailed(false);
		const pending = CHOICES.filter((choice) => selected(choice.field) !== currentChoice(choice.field, value)).map((choice) => ({
			field: choice.field,
			raw: selected(choice.field)
		}));
		(async () => {
			let landed = true;
			for (const edit of pending) if (!await props.setField(edit.field, parseChoice(edit.field, edit.raw))) landed = false;
			setSaving(false);
			if (landed) setDrafts({});
			else setFailed(true);
		})();
	};
	const scheme = value?.tls === "off" ? "http" : "https";
	const port = value?.port ?? 3443;
	const plainPort = value?.compat?.plainPort ?? 0;
	return (0, react_jsx_runtime.jsxs)("li", {
		className: open ? `${RelayCard_module_css_default.card} ${RelayCard_module_css_default.cardOpen}` : RelayCard_module_css_default.card,
		children: [(0, react_jsx_runtime.jsxs)("button", {
			type: "button",
			className: RelayCard_module_css_default.header,
			"aria-expanded": open,
			onClick: () => {
				setOpen(!open);
			},
			children: [
				(0, react_jsx_runtime.jsxs)("span", {
					className: RelayCard_module_css_default.headText,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: RelayCard_module_css_default.name,
						children: "Relay"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: RelayCard_module_css_default.description,
						children: "Remote access to this harness"
					})]
				}),
				dirty ? (0, react_jsx_runtime.jsx)("span", {
					className: RelayCard_module_css_default.pending,
					children: "Unsaved"
				}) : null,
				(0, react_jsx_runtime.jsx)(Chevron, { className: open ? `${RelayCard_module_css_default.chevron} ${RelayCard_module_css_default.chevronOpen}` : RelayCard_module_css_default.chevron })
			]
		}), open ? (0, react_jsx_runtime.jsxs)("div", {
			className: RelayCard_module_css_default.body,
			children: [
				readOnly ? (0, react_jsx_runtime.jsx)("p", {
					className: RelayCard_module_css_default.readOnly,
					role: "status",
					children: "Served read-only to this browser."
				}) : null,
				(0, react_jsx_runtime.jsxs)("div", {
					className: RelayCard_module_css_default.field,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: RelayCard_module_css_default.label,
						children: "Listening"
					}), (0, react_jsx_runtime.jsxs)("span", {
						className: RelayCard_module_css_default.value,
						children: [`${scheme}://<this machine>:${String(port)}`, value?.bind === "127.0.0.1" ? " — loopback only, no device can reach it" : ""]
					})]
				}),
				(0, react_jsx_runtime.jsxs)("div", {
					className: RelayCard_module_css_default.field,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: RelayCard_module_css_default.label,
						children: "Transport"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: RelayCard_module_css_default.value,
						children: value?.tls === "off" ? "Plaintext — anything on the network path can read the traffic and the credentials on it" : value?.tls === "files" ? "A certificate you supplied" : "Self-signed, with a pin published on the pairing page"
					})]
				}),
				plainPort > 0 && (0, react_jsx_runtime.jsx)("div", {
					className: RelayCard_module_css_default.warn,
					children: `A plain listener is running on port ${String(plainPort)} for DSH Mobile 0.5.0. It carries no configuration access, and the clients it admits are recognised by network address rather than a credential.`
				}),
				CHOICES.map((choice) => (0, react_jsx_runtime.jsxs)("div", {
					className: RelayCard_module_css_default.field,
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: RelayCard_module_css_default.label,
							children: choice.label
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: RelayCard_module_css_default.segmented,
							role: "group",
							"aria-label": choice.label,
							children: choice.options.map((option) => {
								const on = option.value === selected(choice.field);
								return (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: on ? `${RelayCard_module_css_default.segment} ${RelayCard_module_css_default.segmentOn}` : RelayCard_module_css_default.segment,
									"aria-pressed": on,
									disabled: readOnly || saving,
									onClick: () => {
										stage(choice.field, option.value);
									},
									children: option.label
								}, option.value);
							})
						}),
						(0, react_jsx_runtime.jsx)("p", {
							className: RelayCard_module_css_default.hint,
							children: choice.hint
						})
					]
				}, choice.field)),
				(0, react_jsx_runtime.jsxs)("div", {
					className: RelayCard_module_css_default.actions,
					children: [
						(0, react_jsx_runtime.jsx)("a", {
							className: RelayCard_module_css_default.action,
							href: "/relay/pair",
							children: "Pair a device"
						}),
						(0, react_jsx_runtime.jsx)("a", {
							className: RelayCard_module_css_default.action,
							href: "/relay/devices",
							children: "Paired devices"
						}),
						(0, react_jsx_runtime.jsx)("a", {
							className: RelayCard_module_css_default.action,
							href: "/relay/password",
							children: "Change the password"
						})
					]
				}),
				dirty ? (0, react_jsx_runtime.jsxs)("div", {
					className: RelayCard_module_css_default.footer,
					children: [
						failed ? (0, react_jsx_runtime.jsx)("p", {
							className: RelayCard_module_css_default.failed,
							role: "status",
							children: "That did not save. The values above are still staged."
						}) : null,
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: RelayCard_module_css_default.discard,
							disabled: saving,
							onClick: () => {
								setDrafts({});
								setFailed(false);
							},
							children: "Discard"
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: RelayCard_module_css_default.save,
							disabled: saving,
							onClick: save,
							children: saving ? "Saving…" : "Save"
						})
					]
				}) : null,
				(0, react_jsx_runtime.jsx)("p", {
					className: RelayCard_module_css_default.hint,
					children: "Saving rebinds the listeners, which drops connections in flight — a phone mid-session reconnects on its own."
				})
			]
		}) : null]
	});
}

//#endregion
//#region lib/types/client/index.js
/** Namespace the node half registers; the join key between the two halves. */
const RELAY_NAMESPACE = "relay";
/** Slot the Plugin configuration tab dispatches, keyed by settings namespace. */
const CARD_SLOT = "settings.plugin.item";
/** Services the renderer must have before this bundle registers anything. */
const inject = ["slots"];
/**
* Register the card.
* @param ctx - the browser plugin context.
*/
function apply(ctx) {
	if (!ctx.settingsScope || typeof ctx.settingsScope.bind !== "function") {
		ctx.logger?.warn?.("dsh-relay: settingsScope service not found on this surface; skipping plugin card registration");
		return;
	}
	const scope = ctx.settingsScope.bind({ namespace: RELAY_NAMESPACE });
	ctx.slots.inject(CARD_SLOT, () => ctx.slots.register({
		name: CARD_SLOT,
		key: RELAY_NAMESPACE,
		inject: () => ({
			hooks: { relayCard: scope },
			setField: async (field, value) => {
				try {
					await scope.set(field, value);
					return true;
				} catch (error) {
					ctx.logger?.warn?.(`dsh-relay: settings write failed: ${String(error)}`);
					return false;
				}
			}
		})
	}, RelayCard));
}

//#endregion
exports.apply = apply;
exports.inject = inject;
return module.exports; } });
//# sourceMappingURL=client.js.map