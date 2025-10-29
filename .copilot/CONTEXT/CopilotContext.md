<html lang="en" suppresshydrationwarning="true" data-qb-installed="true"><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NoorCanvas</title>
    <base href="/">
    <link rel="stylesheet" href="css/bootstrap/bootstrap.min.css">
    <link href="NoorCanvas.styles.css?v=bAe9wRsTLxsOJwwDWShD_-VHowVpNXGln5MlgF-XUVk" rel="stylesheet">
    <!-- Ensure NoorCanvas.styles.css is not included elsewhere to prevent duplication -->
    <!-- NOOR Canvas Font System -->
    <link href="css/fonts/fonts.css?v=G6Wns9j7CKAGfSZlu1ePXb60LtW9RmcpvH_gOHbZG48" rel="stylesheet">
    
    <link href="css/session-transcript.css?v=sqXrZZo6flDp0XOZFQnlxkapv53rzfD1zqoarDHKS24" rel="stylesheet">
    <link href="css/noor-canvas.css?v=vqWlgm6mD4arj9w2ET_bAY-K21nPJCPmrAP56FHdjzk" rel="stylesheet">
    <link href="css/debug-panel.css?v=-clSxQTKYJ_8_FGGWwmh-ofBgXnBJabNqiI7jEGZVD0" rel="stylesheet">
    
    <!-- Font Awesome - Consolidated (Latest version 6.5.1) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer">

    <!-- Tailwind CSS - For Q&A UI Components -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- [DIAGNOSTIC:notyf:libs] Notyf - Modern Toast Notifications (Replaced toastr.js 2025-10-14) ;CLEANUP_OK -->
    <!-- CDN with local fallback for reliability -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css" onerror="this.onerror=null; this.href='~/lib/notyf/notyf.min.css';">
    <script src="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js" onerror="console.error('[DIAGNOSTIC:notyf:libs] CDN failed, loading local fallback ;CLEANUP_OK'); this.onerror=null; this.src='~/lib/notyf/notyf.min.js';"></script>
    
    <!-- NOOR Canvas Notyf Wrapper - Unified toast API with diagnostics -->
    <script src="/js/noor-notyf-wrapper.js?v=W4QtmgfQFFEdC8iZKV97kY6gq7Nq6-sdMpmD6d51-1g"></script>
    
    <!-- jQuery - Still needed for other components -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    
    <!-- SweetAlert2 - For Asset Detection Popups -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script><style>:root{--swal2-outline: 0 0 0 3px rgba(100, 150, 200, 0.5);--swal2-container-padding: 0.625em;--swal2-backdrop: rgba(0, 0, 0, 0.4);--swal2-backdrop-transition: background-color 0.15s;--swal2-width: 32em;--swal2-padding: 0 0 1.25em;--swal2-border: none;--swal2-border-radius: 0.3125rem;--swal2-background: white;--swal2-color: #545454;--swal2-show-animation: swal2-show 0.3s;--swal2-hide-animation: swal2-hide 0.15s forwards;--swal2-icon-zoom: 1;--swal2-icon-animations: true;--swal2-title-padding: 0.8em 1em 0;--swal2-html-container-padding: 1em 1.6em 0.3em;--swal2-input-border: 1px solid #d9d9d9;--swal2-input-border-radius: 0.1875em;--swal2-input-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06), 0 0 0 3px transparent;--swal2-input-background: transparent;--swal2-input-transition: border-color 0.2s, box-shadow 0.2s;--swal2-input-hover-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06), 0 0 0 3px transparent;--swal2-input-focus-border: 1px solid #b4dbed;--swal2-input-focus-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06), 0 0 0 3px rgba(100, 150, 200, 0.5);--swal2-progress-step-background: #add8e6;--swal2-validation-message-background: #f0f0f0;--swal2-validation-message-color: #666;--swal2-footer-border-color: #eee;--swal2-footer-background: transparent;--swal2-footer-color: inherit;--swal2-timer-progress-bar-background: rgba(0, 0, 0, 0.3);--swal2-close-button-position: initial;--swal2-close-button-inset: auto;--swal2-close-button-font-size: 2.5em;--swal2-close-button-color: #ccc;--swal2-close-button-transition: color 0.2s, box-shadow 0.2s;--swal2-close-button-outline: initial;--swal2-close-button-box-shadow: inset 0 0 0 3px transparent;--swal2-close-button-focus-box-shadow: inset var(--swal2-outline);--swal2-close-button-hover-transform: none;--swal2-actions-justify-content: center;--swal2-actions-width: auto;--swal2-actions-margin: 1.25em auto 0;--swal2-actions-padding: 0;--swal2-actions-border-radius: 0;--swal2-actions-background: transparent;--swal2-action-button-transition: background-color 0.2s, box-shadow 0.2s;--swal2-action-button-hover: black 10%;--swal2-action-button-active: black 10%;--swal2-confirm-button-box-shadow: none;--swal2-confirm-button-border-radius: 0.25em;--swal2-confirm-button-background-color: #7066e0;--swal2-confirm-button-color: #fff;--swal2-deny-button-box-shadow: none;--swal2-deny-button-border-radius: 0.25em;--swal2-deny-button-background-color: #dc3741;--swal2-deny-button-color: #fff;--swal2-cancel-button-box-shadow: none;--swal2-cancel-button-border-radius: 0.25em;--swal2-cancel-button-background-color: #6e7881;--swal2-cancel-button-color: #fff;--swal2-toast-show-animation: swal2-toast-show 0.5s;--swal2-toast-hide-animation: swal2-toast-hide 0.1s forwards;--swal2-toast-border: none;--swal2-toast-box-shadow: 0 0 1px hsl(0deg 0% 0% / 0.075), 0 1px 2px hsl(0deg 0% 0% / 0.075), 1px 2px 4px hsl(0deg 0% 0% / 0.075), 1px 3px 8px hsl(0deg 0% 0% / 0.075), 2px 4px 16px hsl(0deg 0% 0% / 0.075)}[data-swal2-theme=dark]{--swal2-dark-theme-black: #19191a;--swal2-dark-theme-white: #e1e1e1;--swal2-background: var(--swal2-dark-theme-black);--swal2-color: var(--swal2-dark-theme-white);--swal2-footer-border-color: #555;--swal2-input-background: color-mix(in srgb, var(--swal2-dark-theme-black), var(--swal2-dark-theme-white) 10%);--swal2-validation-message-background: color-mix( in srgb, var(--swal2-dark-theme-black), var(--swal2-dark-theme-white) 10% );--swal2-validation-message-color: var(--swal2-dark-theme-white);--swal2-timer-progress-bar-background: rgba(255, 255, 255, 0.7)}@media(prefers-color-scheme: dark){[data-swal2-theme=auto]{--swal2-dark-theme-black: #19191a;--swal2-dark-theme-white: #e1e1e1;--swal2-background: var(--swal2-dark-theme-black);--swal2-color: var(--swal2-dark-theme-white);--swal2-footer-border-color: #555;--swal2-input-background: color-mix(in srgb, var(--swal2-dark-theme-black), var(--swal2-dark-theme-white) 10%);--swal2-validation-message-background: color-mix( in srgb, var(--swal2-dark-theme-black), var(--swal2-dark-theme-white) 10% );--swal2-validation-message-color: var(--swal2-dark-theme-white);--swal2-timer-progress-bar-background: rgba(255, 255, 255, 0.7)}}body.swal2-shown:not(.swal2-no-backdrop,.swal2-toast-shown){overflow:hidden}body.swal2-height-auto{height:auto !important}body.swal2-no-backdrop .swal2-container{background-color:rgba(0,0,0,0) !important;pointer-events:none}body.swal2-no-backdrop .swal2-container .swal2-popup{pointer-events:all}body.swal2-no-backdrop .swal2-container .swal2-modal{box-shadow:0 0 10px var(--swal2-backdrop)}body.swal2-toast-shown .swal2-container{box-sizing:border-box;width:360px;max-width:100%;background-color:rgba(0,0,0,0);pointer-events:none}body.swal2-toast-shown .swal2-container.swal2-top{inset:0 auto auto 50%;transform:translateX(-50%)}body.swal2-toast-shown .swal2-container.swal2-top-end,body.swal2-toast-shown .swal2-container.swal2-top-right{inset:0 0 auto auto}body.swal2-toast-shown .swal2-container.swal2-top-start,body.swal2-toast-shown .swal2-container.swal2-top-left{inset:0 auto auto 0}body.swal2-toast-shown .swal2-container.swal2-center-start,body.swal2-toast-shown .swal2-container.swal2-center-left{inset:50% auto auto 0;transform:translateY(-50%)}body.swal2-toast-shown .swal2-container.swal2-center{inset:50% auto auto 50%;transform:translate(-50%, -50%)}body.swal2-toast-shown .swal2-container.swal2-center-end,body.swal2-toast-shown .swal2-container.swal2-center-right{inset:50% 0 auto auto;transform:translateY(-50%)}body.swal2-toast-shown .swal2-container.swal2-bottom-start,body.swal2-toast-shown .swal2-container.swal2-bottom-left{inset:auto auto 0 0}body.swal2-toast-shown .swal2-container.swal2-bottom{inset:auto auto 0 50%;transform:translateX(-50%)}body.swal2-toast-shown .swal2-container.swal2-bottom-end,body.swal2-toast-shown .swal2-container.swal2-bottom-right{inset:auto 0 0 auto}@media print{body.swal2-shown:not(.swal2-no-backdrop,.swal2-toast-shown){overflow-y:scroll !important}body.swal2-shown:not(.swal2-no-backdrop,.swal2-toast-shown)>[aria-hidden=true]{display:none}body.swal2-shown:not(.swal2-no-backdrop,.swal2-toast-shown) .swal2-container{position:static !important}}div:where(.swal2-container){display:grid;position:fixed;z-index:1060;inset:0;box-sizing:border-box;grid-template-areas:"top-start     top            top-end" "center-start  center         center-end" "bottom-start  bottom-center  bottom-end";grid-template-rows:minmax(min-content, auto) minmax(min-content, auto) minmax(min-content, auto);height:100%;padding:var(--swal2-container-padding);overflow-x:hidden;transition:var(--swal2-backdrop-transition);-webkit-overflow-scrolling:touch}div:where(.swal2-container).swal2-backdrop-show,div:where(.swal2-container).swal2-noanimation{background:var(--swal2-backdrop)}div:where(.swal2-container).swal2-backdrop-hide{background:rgba(0,0,0,0) !important}div:where(.swal2-container).swal2-top-start,div:where(.swal2-container).swal2-center-start,div:where(.swal2-container).swal2-bottom-start{grid-template-columns:minmax(0, 1fr) auto auto}div:where(.swal2-container).swal2-top,div:where(.swal2-container).swal2-center,div:where(.swal2-container).swal2-bottom{grid-template-columns:auto minmax(0, 1fr) auto}div:where(.swal2-container).swal2-top-end,div:where(.swal2-container).swal2-center-end,div:where(.swal2-container).swal2-bottom-end{grid-template-columns:auto auto minmax(0, 1fr)}div:where(.swal2-container).swal2-top-start>.swal2-popup{align-self:start}div:where(.swal2-container).swal2-top>.swal2-popup{grid-column:2;place-self:start center}div:where(.swal2-container).swal2-top-end>.swal2-popup,div:where(.swal2-container).swal2-top-right>.swal2-popup{grid-column:3;place-self:start end}div:where(.swal2-container).swal2-center-start>.swal2-popup,div:where(.swal2-container).swal2-center-left>.swal2-popup{grid-row:2;align-self:center}div:where(.swal2-container).swal2-center>.swal2-popup{grid-column:2;grid-row:2;place-self:center center}div:where(.swal2-container).swal2-center-end>.swal2-popup,div:where(.swal2-container).swal2-center-right>.swal2-popup{grid-column:3;grid-row:2;place-self:center end}div:where(.swal2-container).swal2-bottom-start>.swal2-popup,div:where(.swal2-container).swal2-bottom-left>.swal2-popup{grid-column:1;grid-row:3;align-self:end}div:where(.swal2-container).swal2-bottom>.swal2-popup{grid-column:2;grid-row:3;place-self:end center}div:where(.swal2-container).swal2-bottom-end>.swal2-popup,div:where(.swal2-container).swal2-bottom-right>.swal2-popup{grid-column:3;grid-row:3;place-self:end end}div:where(.swal2-container).swal2-grow-row>.swal2-popup,div:where(.swal2-container).swal2-grow-fullscreen>.swal2-popup{grid-column:1/4;width:100%}div:where(.swal2-container).swal2-grow-column>.swal2-popup,div:where(.swal2-container).swal2-grow-fullscreen>.swal2-popup{grid-row:1/4;align-self:stretch}div:where(.swal2-container).swal2-no-transition{transition:none !important}div:where(.swal2-container)[popover]{width:auto;border:0}div:where(.swal2-container) div:where(.swal2-popup){display:none;position:relative;box-sizing:border-box;grid-template-columns:minmax(0, 100%);width:var(--swal2-width);max-width:100%;padding:var(--swal2-padding);border:var(--swal2-border);border-radius:var(--swal2-border-radius);background:var(--swal2-background);color:var(--swal2-color);font-family:inherit;font-size:1rem;container-name:swal2-popup}div:where(.swal2-container) div:where(.swal2-popup):focus{outline:none}div:where(.swal2-container) div:where(.swal2-popup).swal2-loading{overflow-y:hidden}div:where(.swal2-container) div:where(.swal2-popup).swal2-draggable{cursor:grab}div:where(.swal2-container) div:where(.swal2-popup).swal2-draggable div:where(.swal2-icon){cursor:grab}div:where(.swal2-container) div:where(.swal2-popup).swal2-dragging{cursor:grabbing}div:where(.swal2-container) div:where(.swal2-popup).swal2-dragging div:where(.swal2-icon){cursor:grabbing}div:where(.swal2-container) h2:where(.swal2-title){position:relative;max-width:100%;margin:0;padding:var(--swal2-title-padding);color:inherit;font-size:1.875em;font-weight:600;text-align:center;text-transform:none;overflow-wrap:break-word;cursor:initial}div:where(.swal2-container) div:where(.swal2-actions){display:flex;z-index:1;box-sizing:border-box;flex-wrap:wrap;align-items:center;justify-content:var(--swal2-actions-justify-content);width:var(--swal2-actions-width);margin:var(--swal2-actions-margin);padding:var(--swal2-actions-padding);border-radius:var(--swal2-actions-border-radius);background:var(--swal2-actions-background)}div:where(.swal2-container) div:where(.swal2-loader){display:none;align-items:center;justify-content:center;width:2.2em;height:2.2em;margin:0 1.875em;animation:swal2-rotate-loading 1.5s linear 0s infinite normal;border-width:.25em;border-style:solid;border-radius:100%;border-color:#2778c4 rgba(0,0,0,0) #2778c4 rgba(0,0,0,0)}div:where(.swal2-container) button:where(.swal2-styled){margin:.3125em;padding:.625em 1.1em;transition:var(--swal2-action-button-transition);border:none;box-shadow:0 0 0 3px rgba(0,0,0,0);font-weight:500}div:where(.swal2-container) button:where(.swal2-styled):not([disabled]){cursor:pointer}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-confirm){border-radius:var(--swal2-confirm-button-border-radius);background:initial;background-color:var(--swal2-confirm-button-background-color);box-shadow:var(--swal2-confirm-button-box-shadow);color:var(--swal2-confirm-button-color);font-size:1em}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-confirm):hover{background-color:color-mix(in srgb, var(--swal2-confirm-button-background-color), var(--swal2-action-button-hover))}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-confirm):active{background-color:color-mix(in srgb, var(--swal2-confirm-button-background-color), var(--swal2-action-button-active))}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-deny){border-radius:var(--swal2-deny-button-border-radius);background:initial;background-color:var(--swal2-deny-button-background-color);box-shadow:var(--swal2-deny-button-box-shadow);color:var(--swal2-deny-button-color);font-size:1em}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-deny):hover{background-color:color-mix(in srgb, var(--swal2-deny-button-background-color), var(--swal2-action-button-hover))}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-deny):active{background-color:color-mix(in srgb, var(--swal2-deny-button-background-color), var(--swal2-action-button-active))}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-cancel){border-radius:var(--swal2-cancel-button-border-radius);background:initial;background-color:var(--swal2-cancel-button-background-color);box-shadow:var(--swal2-cancel-button-box-shadow);color:var(--swal2-cancel-button-color);font-size:1em}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-cancel):hover{background-color:color-mix(in srgb, var(--swal2-cancel-button-background-color), var(--swal2-action-button-hover))}div:where(.swal2-container) button:where(.swal2-styled):where(.swal2-cancel):active{background-color:color-mix(in srgb, var(--swal2-cancel-button-background-color), var(--swal2-action-button-active))}div:where(.swal2-container) button:where(.swal2-styled):focus-visible{outline:none;box-shadow:var(--swal2-action-button-focus-box-shadow)}div:where(.swal2-container) button:where(.swal2-styled)[disabled]:not(.swal2-loading){opacity:.4}div:where(.swal2-container) button:where(.swal2-styled)::-moz-focus-inner{border:0}div:where(.swal2-container) div:where(.swal2-footer){margin:1em 0 0;padding:1em 1em 0;border-top:1px solid var(--swal2-footer-border-color);background:var(--swal2-footer-background);color:var(--swal2-footer-color);font-size:1em;text-align:center;cursor:initial}div:where(.swal2-container) .swal2-timer-progress-bar-container{position:absolute;right:0;bottom:0;left:0;grid-column:auto !important;overflow:hidden;border-bottom-right-radius:var(--swal2-border-radius);border-bottom-left-radius:var(--swal2-border-radius)}div:where(.swal2-container) div:where(.swal2-timer-progress-bar){width:100%;height:.25em;background:var(--swal2-timer-progress-bar-background)}div:where(.swal2-container) img:where(.swal2-image){max-width:100%;margin:2em auto 1em;cursor:initial}div:where(.swal2-container) button:where(.swal2-close){position:var(--swal2-close-button-position);inset:var(--swal2-close-button-inset);z-index:2;align-items:center;justify-content:center;width:1.2em;height:1.2em;margin-top:0;margin-right:0;margin-bottom:-1.2em;padding:0;overflow:hidden;transition:var(--swal2-close-button-transition);border:none;border-radius:var(--swal2-border-radius);outline:var(--swal2-close-button-outline);background:rgba(0,0,0,0);color:var(--swal2-close-button-color);font-family:monospace;font-size:var(--swal2-close-button-font-size);cursor:pointer;justify-self:end}div:where(.swal2-container) button:where(.swal2-close):hover{transform:var(--swal2-close-button-hover-transform);background:rgba(0,0,0,0);color:#f27474}div:where(.swal2-container) button:where(.swal2-close):focus-visible{outline:none;box-shadow:var(--swal2-close-button-focus-box-shadow)}div:where(.swal2-container) button:where(.swal2-close)::-moz-focus-inner{border:0}div:where(.swal2-container) div:where(.swal2-html-container){z-index:1;justify-content:center;margin:0;padding:var(--swal2-html-container-padding);overflow:auto;color:inherit;font-size:1.125em;font-weight:normal;line-height:normal;text-align:center;overflow-wrap:break-word;word-break:break-word;cursor:initial}div:where(.swal2-container) input:where(.swal2-input),div:where(.swal2-container) input:where(.swal2-file),div:where(.swal2-container) textarea:where(.swal2-textarea),div:where(.swal2-container) select:where(.swal2-select),div:where(.swal2-container) div:where(.swal2-radio),div:where(.swal2-container) label:where(.swal2-checkbox){margin:1em 2em 3px}div:where(.swal2-container) input:where(.swal2-input),div:where(.swal2-container) input:where(.swal2-file),div:where(.swal2-container) textarea:where(.swal2-textarea){box-sizing:border-box;width:auto;transition:var(--swal2-input-transition);border:var(--swal2-input-border);border-radius:var(--swal2-input-border-radius);background:var(--swal2-input-background);box-shadow:var(--swal2-input-box-shadow);color:inherit;font-size:1.125em}div:where(.swal2-container) input:where(.swal2-input).swal2-inputerror,div:where(.swal2-container) input:where(.swal2-file).swal2-inputerror,div:where(.swal2-container) textarea:where(.swal2-textarea).swal2-inputerror{border-color:#f27474 !important;box-shadow:0 0 2px #f27474 !important}div:where(.swal2-container) input:where(.swal2-input):hover,div:where(.swal2-container) input:where(.swal2-file):hover,div:where(.swal2-container) textarea:where(.swal2-textarea):hover{box-shadow:var(--swal2-input-hover-box-shadow)}div:where(.swal2-container) input:where(.swal2-input):focus,div:where(.swal2-container) input:where(.swal2-file):focus,div:where(.swal2-container) textarea:where(.swal2-textarea):focus{border:var(--swal2-input-focus-border);outline:none;box-shadow:var(--swal2-input-focus-box-shadow)}div:where(.swal2-container) input:where(.swal2-input)::placeholder,div:where(.swal2-container) input:where(.swal2-file)::placeholder,div:where(.swal2-container) textarea:where(.swal2-textarea)::placeholder{color:#ccc}div:where(.swal2-container) .swal2-range{margin:1em 2em 3px;background:var(--swal2-background)}div:where(.swal2-container) .swal2-range input{width:80%}div:where(.swal2-container) .swal2-range output{width:20%;color:inherit;font-weight:600;text-align:center}div:where(.swal2-container) .swal2-range input,div:where(.swal2-container) .swal2-range output{height:2.625em;padding:0;font-size:1.125em;line-height:2.625em}div:where(.swal2-container) .swal2-input{height:2.625em;padding:0 .75em}div:where(.swal2-container) .swal2-file{width:75%;margin-right:auto;margin-left:auto;background:var(--swal2-input-background);font-size:1.125em}div:where(.swal2-container) .swal2-textarea{height:6.75em;padding:.75em}div:where(.swal2-container) .swal2-select{min-width:50%;max-width:100%;padding:.375em .625em;background:var(--swal2-input-background);color:inherit;font-size:1.125em}div:where(.swal2-container) .swal2-radio,div:where(.swal2-container) .swal2-checkbox{align-items:center;justify-content:center;background:var(--swal2-background);color:inherit}div:where(.swal2-container) .swal2-radio label,div:where(.swal2-container) .swal2-checkbox label{margin:0 .6em;font-size:1.125em}div:where(.swal2-container) .swal2-radio input,div:where(.swal2-container) .swal2-checkbox input{flex-shrink:0;margin:0 .4em}div:where(.swal2-container) label:where(.swal2-input-label){display:flex;justify-content:center;margin:1em auto 0}div:where(.swal2-container) div:where(.swal2-validation-message){align-items:center;justify-content:center;margin:1em 0 0;padding:.625em;overflow:hidden;background:var(--swal2-validation-message-background);color:var(--swal2-validation-message-color);font-size:1em;font-weight:300}div:where(.swal2-container) div:where(.swal2-validation-message)::before{content:"!";display:inline-block;width:1.5em;min-width:1.5em;height:1.5em;margin:0 .625em;border-radius:50%;background-color:#f27474;color:#fff;font-weight:600;line-height:1.5em;text-align:center}div:where(.swal2-container) .swal2-progress-steps{flex-wrap:wrap;align-items:center;max-width:100%;margin:1.25em auto;padding:0;background:rgba(0,0,0,0);font-weight:600}div:where(.swal2-container) .swal2-progress-steps li{display:inline-block;position:relative}div:where(.swal2-container) .swal2-progress-steps .swal2-progress-step{z-index:20;flex-shrink:0;width:2em;height:2em;border-radius:2em;background:#2778c4;color:#fff;line-height:2em;text-align:center}div:where(.swal2-container) .swal2-progress-steps .swal2-progress-step.swal2-active-progress-step{background:#2778c4}div:where(.swal2-container) .swal2-progress-steps .swal2-progress-step.swal2-active-progress-step~.swal2-progress-step{background:var(--swal2-progress-step-background);color:#fff}div:where(.swal2-container) .swal2-progress-steps .swal2-progress-step.swal2-active-progress-step~.swal2-progress-step-line{background:var(--swal2-progress-step-background)}div:where(.swal2-container) .swal2-progress-steps .swal2-progress-step-line{z-index:10;flex-shrink:0;width:2.5em;height:.4em;margin:0 -1px;background:#2778c4}div:where(.swal2-icon){position:relative;box-sizing:content-box;justify-content:center;width:5em;height:5em;margin:2.5em auto .6em;zoom:var(--swal2-icon-zoom);border:.25em solid rgba(0,0,0,0);border-radius:50%;border-color:#000;font-family:inherit;line-height:5em;cursor:default;user-select:none}div:where(.swal2-icon) .swal2-icon-content{display:flex;align-items:center;font-size:3.75em}div:where(.swal2-icon).swal2-error{border-color:#f27474;color:#f27474}div:where(.swal2-icon).swal2-error .swal2-x-mark{position:relative;flex-grow:1}div:where(.swal2-icon).swal2-error [class^=swal2-x-mark-line]{display:block;position:absolute;top:2.3125em;width:2.9375em;height:.3125em;border-radius:.125em;background-color:#f27474}div:where(.swal2-icon).swal2-error [class^=swal2-x-mark-line][class$=left]{left:1.0625em;transform:rotate(45deg)}div:where(.swal2-icon).swal2-error [class^=swal2-x-mark-line][class$=right]{right:1em;transform:rotate(-45deg)}@container swal2-popup style(--swal2-icon-animations:true){div:where(.swal2-icon).swal2-error.swal2-icon-show{animation:swal2-animate-error-icon .5s}div:where(.swal2-icon).swal2-error.swal2-icon-show .swal2-x-mark{animation:swal2-animate-error-x-mark .5s}}div:where(.swal2-icon).swal2-warning{border-color:#f8bb86;color:#f8bb86}@container swal2-popup style(--swal2-icon-animations:true){div:where(.swal2-icon).swal2-warning.swal2-icon-show{animation:swal2-animate-error-icon .5s}div:where(.swal2-icon).swal2-warning.swal2-icon-show .swal2-icon-content{animation:swal2-animate-i-mark .5s}}div:where(.swal2-icon).swal2-info{border-color:#3fc3ee;color:#3fc3ee}@container swal2-popup style(--swal2-icon-animations:true){div:where(.swal2-icon).swal2-info.swal2-icon-show{animation:swal2-animate-error-icon .5s}div:where(.swal2-icon).swal2-info.swal2-icon-show .swal2-icon-content{animation:swal2-animate-i-mark .8s}}div:where(.swal2-icon).swal2-question{border-color:#87adbd;color:#87adbd}@container swal2-popup style(--swal2-icon-animations:true){div:where(.swal2-icon).swal2-question.swal2-icon-show{animation:swal2-animate-error-icon .5s}div:where(.swal2-icon).swal2-question.swal2-icon-show .swal2-icon-content{animation:swal2-animate-question-mark .8s}}div:where(.swal2-icon).swal2-success{border-color:#a5dc86;color:#a5dc86}div:where(.swal2-icon).swal2-success [class^=swal2-success-circular-line]{position:absolute;width:3.75em;height:7.5em;border-radius:50%}div:where(.swal2-icon).swal2-success [class^=swal2-success-circular-line][class$=left]{top:-0.4375em;left:-2.0635em;transform:rotate(-45deg);transform-origin:3.75em 3.75em;border-radius:7.5em 0 0 7.5em}div:where(.swal2-icon).swal2-success [class^=swal2-success-circular-line][class$=right]{top:-0.6875em;left:1.875em;transform:rotate(-45deg);transform-origin:0 3.75em;border-radius:0 7.5em 7.5em 0}div:where(.swal2-icon).swal2-success .swal2-success-ring{position:absolute;z-index:2;top:-0.25em;left:-0.25em;box-sizing:content-box;width:100%;height:100%;border:.25em solid rgba(165,220,134,.3);border-radius:50%}div:where(.swal2-icon).swal2-success .swal2-success-fix{position:absolute;z-index:1;top:.5em;left:1.625em;width:.4375em;height:5.625em;transform:rotate(-45deg)}div:where(.swal2-icon).swal2-success [class^=swal2-success-line]{display:block;position:absolute;z-index:2;height:.3125em;border-radius:.125em;background-color:#a5dc86}div:where(.swal2-icon).swal2-success [class^=swal2-success-line][class$=tip]{top:2.875em;left:.8125em;width:1.5625em;transform:rotate(45deg)}div:where(.swal2-icon).swal2-success [class^=swal2-success-line][class$=long]{top:2.375em;right:.5em;width:2.9375em;transform:rotate(-45deg)}@container swal2-popup style(--swal2-icon-animations:true){div:where(.swal2-icon).swal2-success.swal2-icon-show .swal2-success-line-tip{animation:swal2-animate-success-line-tip .75s}div:where(.swal2-icon).swal2-success.swal2-icon-show .swal2-success-line-long{animation:swal2-animate-success-line-long .75s}div:where(.swal2-icon).swal2-success.swal2-icon-show .swal2-success-circular-line-right{animation:swal2-rotate-success-circular-line 4.25s ease-in}}[class^=swal2]{-webkit-tap-highlight-color:rgba(0,0,0,0)}.swal2-show{animation:var(--swal2-show-animation)}.swal2-hide{animation:var(--swal2-hide-animation)}.swal2-noanimation{transition:none}.swal2-scrollbar-measure{position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll}.swal2-rtl .swal2-close{margin-right:initial;margin-left:0}.swal2-rtl .swal2-timer-progress-bar{right:0;left:auto}.swal2-toast{box-sizing:border-box;grid-column:1/4 !important;grid-row:1/4 !important;grid-template-columns:min-content auto min-content;padding:1em;overflow-y:hidden;border:var(--swal2-toast-border);background:var(--swal2-background);box-shadow:var(--swal2-toast-box-shadow);pointer-events:all}.swal2-toast>*{grid-column:2}.swal2-toast h2:where(.swal2-title){margin:.5em 1em;padding:0;font-size:1em;text-align:initial}.swal2-toast .swal2-loading{justify-content:center}.swal2-toast input:where(.swal2-input){height:2em;margin:.5em;font-size:1em}.swal2-toast .swal2-validation-message{font-size:1em}.swal2-toast div:where(.swal2-footer){margin:.5em 0 0;padding:.5em 0 0;font-size:.8em}.swal2-toast button:where(.swal2-close){grid-column:3/3;grid-row:1/99;align-self:center;width:.8em;height:.8em;margin:0;font-size:2em}.swal2-toast div:where(.swal2-html-container){margin:.5em 1em;padding:0;overflow:initial;font-size:1em;text-align:initial}.swal2-toast div:where(.swal2-html-container):empty{padding:0}.swal2-toast .swal2-loader{grid-column:1;grid-row:1/99;align-self:center;width:2em;height:2em;margin:.25em}.swal2-toast .swal2-icon{grid-column:1;grid-row:1/99;align-self:center;width:2em;min-width:2em;height:2em;margin:0 .5em 0 0}.swal2-toast .swal2-icon .swal2-icon-content{display:flex;align-items:center;font-size:1.8em;font-weight:bold}.swal2-toast .swal2-icon.swal2-success .swal2-success-ring{width:2em;height:2em}.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line]{top:.875em;width:1.375em}.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=left]{left:.3125em}.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=right]{right:.3125em}.swal2-toast div:where(.swal2-actions){justify-content:flex-start;height:auto;margin:0;margin-top:.5em;padding:0 .5em}.swal2-toast button:where(.swal2-styled){margin:.25em .5em;padding:.4em .6em;font-size:1em}.swal2-toast .swal2-success{border-color:#a5dc86}.swal2-toast .swal2-success [class^=swal2-success-circular-line]{position:absolute;width:1.6em;height:3em;border-radius:50%}.swal2-toast .swal2-success [class^=swal2-success-circular-line][class$=left]{top:-0.8em;left:-0.5em;transform:rotate(-45deg);transform-origin:2em 2em;border-radius:4em 0 0 4em}.swal2-toast .swal2-success [class^=swal2-success-circular-line][class$=right]{top:-0.25em;left:.9375em;transform-origin:0 1.5em;border-radius:0 4em 4em 0}.swal2-toast .swal2-success .swal2-success-ring{width:2em;height:2em}.swal2-toast .swal2-success .swal2-success-fix{top:0;left:.4375em;width:.4375em;height:2.6875em}.swal2-toast .swal2-success [class^=swal2-success-line]{height:.3125em}.swal2-toast .swal2-success [class^=swal2-success-line][class$=tip]{top:1.125em;left:.1875em;width:.75em}.swal2-toast .swal2-success [class^=swal2-success-line][class$=long]{top:.9375em;right:.1875em;width:1.375em}@container swal2-popup style(--swal2-icon-animations:true){.swal2-toast .swal2-success.swal2-icon-show .swal2-success-line-tip{animation:swal2-toast-animate-success-line-tip .75s}.swal2-toast .swal2-success.swal2-icon-show .swal2-success-line-long{animation:swal2-toast-animate-success-line-long .75s}}.swal2-toast.swal2-show{animation:var(--swal2-toast-show-animation)}.swal2-toast.swal2-hide{animation:var(--swal2-toast-hide-animation)}@keyframes swal2-show{0%{transform:translate3d(0, -50px, 0) scale(0.9);opacity:0}100%{transform:translate3d(0, 0, 0) scale(1);opacity:1}}@keyframes swal2-hide{0%{transform:translate3d(0, 0, 0) scale(1);opacity:1}100%{transform:translate3d(0, -50px, 0) scale(0.9);opacity:0}}@keyframes swal2-animate-success-line-tip{0%{top:1.1875em;left:.0625em;width:0}54%{top:1.0625em;left:.125em;width:0}70%{top:2.1875em;left:-0.375em;width:3.125em}84%{top:3em;left:1.3125em;width:1.0625em}100%{top:2.8125em;left:.8125em;width:1.5625em}}@keyframes swal2-animate-success-line-long{0%{top:3.375em;right:2.875em;width:0}65%{top:3.375em;right:2.875em;width:0}84%{top:2.1875em;right:0;width:3.4375em}100%{top:2.375em;right:.5em;width:2.9375em}}@keyframes swal2-rotate-success-circular-line{0%{transform:rotate(-45deg)}5%{transform:rotate(-45deg)}12%{transform:rotate(-405deg)}100%{transform:rotate(-405deg)}}@keyframes swal2-animate-error-x-mark{0%{margin-top:1.625em;transform:scale(0.4);opacity:0}50%{margin-top:1.625em;transform:scale(0.4);opacity:0}80%{margin-top:-0.375em;transform:scale(1.15)}100%{margin-top:0;transform:scale(1);opacity:1}}@keyframes swal2-animate-error-icon{0%{transform:rotateX(100deg);opacity:0}100%{transform:rotateX(0deg);opacity:1}}@keyframes swal2-rotate-loading{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes swal2-animate-question-mark{0%{transform:rotateY(-360deg)}100%{transform:rotateY(0)}}@keyframes swal2-animate-i-mark{0%{transform:rotateZ(45deg);opacity:0}25%{transform:rotateZ(-25deg);opacity:.4}50%{transform:rotateZ(15deg);opacity:.8}75%{transform:rotateZ(-5deg);opacity:1}100%{transform:rotateX(0);opacity:1}}@keyframes swal2-toast-show{0%{transform:translateY(-0.625em) rotateZ(2deg)}33%{transform:translateY(0) rotateZ(-2deg)}66%{transform:translateY(0.3125em) rotateZ(2deg)}100%{transform:translateY(0) rotateZ(0deg)}}@keyframes swal2-toast-hide{100%{transform:rotateZ(1deg);opacity:0}}@keyframes swal2-toast-animate-success-line-tip{0%{top:.5625em;left:.0625em;width:0}54%{top:.125em;left:.125em;width:0}70%{top:.625em;left:-0.25em;width:1.625em}84%{top:1.0625em;left:.75em;width:.5em}100%{top:1.125em;left:.1875em;width:.75em}}@keyframes swal2-toast-animate-success-line-long{0%{top:1.625em;right:1.375em;width:0}65%{top:1.25em;right:.9375em;width:0}84%{top:.9375em;right:0;width:1.125em}100%{top:.9375em;right:.1875em;width:1.375em}}</style>

    <!-- Centralized Google Fonts (consolidated from all pages) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <!-- Core fonts: Inter, Poppins, Amiri, Lato, Lora, Noto Nastaliq Urdu -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Amiri:wght@400;700&amp;family=Lato:wght@400;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;family=Playfair+Display:wght@400;700;900&amp;family=Poppins:wght@400;600;700&amp;family=Noto+Nastaliq+Urdu&amp;display=swap" rel="stylesheet">
    <!-- Enhanced Arabic Script Support -->
    <link href="https://fonts.googleapis.com/css2?family=Harmattan:wght@400;500;600;700&amp;family=Noto+Naskh+Arabic:wght@400;500;600;700&amp;family=Scheherazade+New:wght@400;700&amp;display=swap" rel="stylesheet">
    <!-- Additional decorative fonts from HostControlPanel -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&amp;family=Cairo:wght@400;700&amp;display=swap" rel="stylesheet">
<style>*, ::before, ::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/* ! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com */*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}::after,::before{--tw-content:''}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.mb-1{margin-bottom:0.25rem}.mb-3{margin-bottom:0.75rem}.mr-2{margin-right:0.5rem}.mt-2{margin-top:0.5rem}.mt-3{margin-top:0.75rem}.flex{display:flex}.w-full{width:100%}.items-center{align-items:center}.justify-between{justify-content:space-between}.space-y-2 > :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse))}.rounded-full{border-radius:9999px}.rounded{border-radius:0.25rem}.rounded-lg{border-radius:0.5rem}.border{border-width:1px}.border-b{border-bottom-width:1px}.border-t{border-top-width:1px}.border-gray-200{--tw-border-opacity:1;border-color:rgb(229 231 235 / var(--tw-border-opacity, 1))}.border-gray-600{--tw-border-opacity:1;border-color:rgb(75 85 99 / var(--tw-border-opacity, 1))}.bg-blue-600{--tw-bg-opacity:1;background-color:rgb(37 99 235 / var(--tw-bg-opacity, 1))}.bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81 / var(--tw-bg-opacity, 1))}.bg-gray-800{--tw-bg-opacity:1;background-color:rgb(31 41 55 / var(--tw-bg-opacity, 1))}.p-4{padding:1rem}.px-2{padding-left:0.5rem;padding-right:0.5rem}.px-3{padding-left:0.75rem;padding-right:0.75rem}.py-1{padding-top:0.25rem;padding-bottom:0.25rem}.py-2{padding-top:0.5rem;padding-bottom:0.5rem}.pb-2{padding-bottom:0.5rem}.pt-3{padding-top:0.75rem}.text-left{text-align:left}.font-mono{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:0.875rem;line-height:1.25rem}.text-xs{font-size:0.75rem;line-height:1rem}.font-bold{font-weight:700}.text-white{--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity, 1))}.text-blue-400{--tw-text-opacity:1;color:rgb(96 165 250 / var(--tw-text-opacity, 1))}.text-gray-300{--tw-text-opacity:1;color:rgb(209 213 219 / var(--tw-text-opacity, 1))}.shadow-lg{--tw-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.shadow-xl{--tw-shadow:0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.transition-colors{transition-property:color, background-color, border-color, fill, stroke, -webkit-text-decoration-color;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, -webkit-text-decoration-color;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.duration-200{transition-duration:200ms}.ease-in-out{transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.hover\:bg-blue-700:hover{--tw-bg-opacity:1;background-color:rgb(29 78 216 / var(--tw-bg-opacity, 1))}.hover\:text-white:hover{--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity, 1))}.disabled\:bg-gray-400:disabled{--tw-bg-opacity:1;background-color:rgb(156 163 175 / var(--tw-bg-opacity, 1))}</style><style type="text/css">.lf-progress {
  -webkit-appearance: none;
  -moz-apperance: none;
  width: 100%;
  /* margin: 0 10px; */
  height: 4px;
  border-radius: 3px;
  cursor: pointer;
}
.lf-progress:focus {
  outline: none;
  border: none;
}
.lf-progress::-moz-range-track {
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
}
.lf-progress::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  height: 13px;
  width: 13px;
  border: 0;
  border-radius: 50%;
  background: #0fccce;
  cursor: pointer;
}
.lf-progress::-moz-range-thumb {
  -moz-appearance: none !important;
  height: 13px;
  width: 13px;
  border: 0;
  border-radius: 50%;
  background: #0fccce;
  cursor: pointer;
}
.lf-progress::-ms-track {
  width: 100%;
  height: 3px;
  cursor: pointer;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
.lf-progress::-ms-fill-lower {
  background: #ccc;
  border-radius: 3px;
}
.lf-progress::-ms-fill-upper {
  background: #ccc;
  border-radius: 3px;
}
.lf-progress::-ms-thumb {
  border: 0;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: #0fccce;
  cursor: pointer;
}
.lf-progress:focus::-ms-fill-lower {
  background: #ccc;
}
.lf-progress:focus::-ms-fill-upper {
  background: #ccc;
}
.lf-player-container :focus {
  outline: 0;
}
.lf-popover {
  position: relative;
}

.lf-popover-content {
  display: inline-block;
  position: absolute;
  opacity: 1;
  visibility: visible;
  transform: translate(0, -10px);
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
  transition: all 0.3s cubic-bezier(0.75, -0.02, 0.2, 0.97);
}

.lf-popover-content.hidden {
  opacity: 0;
  visibility: hidden;
  transform: translate(0, 0px);
}

.lf-player-btn-container {
  display: flex;
  align-items: center;
}
.lf-player-btn {
  cursor: pointer;
  fill: #999;
  width: 14px;
}

.lf-player-btn.active {
  fill: #555;
}

.lf-popover {
  position: relative;
}

.lf-popover-content {
  display: inline-block;
  position: absolute;
  background-color: #ffffff;
  opacity: 1;

  transform: translate(0, -10px);
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
  transition: all 0.3s cubic-bezier(0.75, -0.02, 0.2, 0.97);
  padding: 10px;
}

.lf-popover-content.hidden {
  opacity: 0;
  visibility: hidden;
  transform: translate(0, 0px);
}

.lf-arrow {
  position: absolute;
  z-index: -1;
  content: '';
  bottom: -9px;
  border-style: solid;
  border-width: 10px 10px 0px 10px;
}

.lf-left-align,
.lf-left-align .lfarrow {
  left: 0;
  right: unset;
}

.lf-right-align,
.lf-right-align .lf-arrow {
  right: 0;
  left: unset;
}

.lf-text-input {
  border: 1px #ccc solid;
  border-radius: 5px;
  padding: 3px;
  width: 60px;
  margin: 0;
}

.lf-color-picker {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 90px;
}

.lf-color-selectors {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.lf-color-component {
  display: flex;
  flex-direction: row;
  font-size: 12px;
  align-items: center;
  justify-content: center;
}

.lf-color-component strong {
  width: 40px;
}

.lf-color-component input[type='range'] {
  margin: 0 0 0 10px;
}

.lf-color-component input[type='number'] {
  width: 50px;
  margin: 0 0 0 10px;
}

.lf-color-preview {
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding-left: 5px;
}

.lf-preview {
  height: 60px;
  width: 60px;
}

.lf-popover-snapshot {
  width: 150px;
}
.lf-popover-snapshot h5 {
  margin: 5px 0 10px 0;
  font-size: 0.75rem;
}
.lf-popover-snapshot a {
  display: block;
  text-decoration: none;
}
.lf-popover-snapshot a:before {
  content: '⥼';
  margin-right: 5px;
}
.lf-popover-snapshot .lf-note {
  display: block;
  margin-top: 10px;
  color: #999;
}
.lf-player-controls > div {
  margin-right: 5px;
  margin-left: 5px;
}
.lf-player-controls > div:first-child {
  margin-left: 0px;
}
.lf-player-controls > div:last-child {
  margin-right: 0px;
}
</style><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&amp;family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&amp;display=swap"><style type="text/css">.lf-progress {
  -webkit-appearance: none;
  -moz-apperance: none;
  width: 100%;
  /* margin: 0 10px; */
  height: 4px;
  border-radius: 3px;
  cursor: pointer;
}
.lf-progress:focus {
  outline: none;
  border: none;
}
.lf-progress::-moz-range-track {
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
}
.lf-progress::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  height: 13px;
  width: 13px;
  border: 0;
  border-radius: 50%;
  background: #0fccce;
  cursor: pointer;
}
.lf-progress::-moz-range-thumb {
  -moz-appearance: none !important;
  height: 13px;
  width: 13px;
  border: 0;
  border-radius: 50%;
  background: #0fccce;
  cursor: pointer;
}
.lf-progress::-ms-track {
  width: 100%;
  height: 3px;
  cursor: pointer;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
.lf-progress::-ms-fill-lower {
  background: #ccc;
  border-radius: 3px;
}
.lf-progress::-ms-fill-upper {
  background: #ccc;
  border-radius: 3px;
}
.lf-progress::-ms-thumb {
  border: 0;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: #0fccce;
  cursor: pointer;
}
.lf-progress:focus::-ms-fill-lower {
  background: #ccc;
}
.lf-progress:focus::-ms-fill-upper {
  background: #ccc;
}
.lf-player-container :focus {
  outline: 0;
}
.lf-popover {
  position: relative;
}

.lf-popover-content {
  display: inline-block;
  position: absolute;
  opacity: 1;
  visibility: visible;
  transform: translate(0, -10px);
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
  transition: all 0.3s cubic-bezier(0.75, -0.02, 0.2, 0.97);
}

.lf-popover-content.hidden {
  opacity: 0;
  visibility: hidden;
  transform: translate(0, 0px);
}

.lf-player-btn-container {
  display: flex;
  align-items: center;
}
.lf-player-btn {
  cursor: pointer;
  fill: #999;
  width: 14px;
}

.lf-player-btn.active {
  fill: #555;
}

.lf-popover {
  position: relative;
}

.lf-popover-content {
  display: inline-block;
  position: absolute;
  background-color: #ffffff;
  opacity: 1;

  transform: translate(0, -10px);
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
  transition: all 0.3s cubic-bezier(0.75, -0.02, 0.2, 0.97);
  padding: 10px;
}

.lf-popover-content.hidden {
  opacity: 0;
  visibility: hidden;
  transform: translate(0, 0px);
}

.lf-arrow {
  position: absolute;
  z-index: -1;
  content: '';
  bottom: -9px;
  border-style: solid;
  border-width: 10px 10px 0px 10px;
}

.lf-left-align,
.lf-left-align .lfarrow {
  left: 0;
  right: unset;
}

.lf-right-align,
.lf-right-align .lf-arrow {
  right: 0;
  left: unset;
}

.lf-text-input {
  border: 1px #ccc solid;
  border-radius: 5px;
  padding: 3px;
  width: 60px;
  margin: 0;
}

.lf-color-picker {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 90px;
}

.lf-color-selectors {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.lf-color-component {
  display: flex;
  flex-direction: row;
  font-size: 12px;
  align-items: center;
  justify-content: center;
}

.lf-color-component strong {
  width: 40px;
}

.lf-color-component input[type='range'] {
  margin: 0 0 0 10px;
}

.lf-color-component input[type='number'] {
  width: 50px;
  margin: 0 0 0 10px;
}

.lf-color-preview {
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding-left: 5px;
}

.lf-preview {
  height: 60px;
  width: 60px;
}

.lf-popover-snapshot {
  width: 150px;
}
.lf-popover-snapshot h5 {
  margin: 5px 0 10px 0;
  font-size: 0.75rem;
}
.lf-popover-snapshot a {
  display: block;
  text-decoration: none;
}
.lf-popover-snapshot a:before {
  content: '⥼';
  margin-right: 5px;
}
.lf-popover-snapshot .lf-note {
  display: block;
  margin-top: 10px;
  color: #999;
}
.lf-player-controls > div {
  margin-right: 5px;
  margin-left: 5px;
}
.lf-player-controls > div:first-child {
  margin-left: 0px;
}
.lf-player-controls > div:last-child {
  margin-right: 0px;
}
</style><script id="transcript-section-parser-dynamic" src="/js/transcript-section-parser.js?v=1761589236593"></script></head>
<body data-new-gr-c-s-check-loaded="14.1259.0" data-gr-ext-installed="">
    <!--!--><!--!--><!--!--><!--!--><!--!--><div class="nc-landing-container"><!--!--><!--!--><!--!--><!--!-->

<!--!--><!--!--><div style="background-color:#F8F5F1;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:1rem;font-family:'Inter',sans-serif;"><div style="width:95%;background-color:white;border-radius:1.5rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);padding:2rem;display:flex;flex-direction:column;gap:1.5rem;"><!--!--><header style="text-align:center;background:linear-gradient(135deg,#F8F5F1,#FFFFFF);border-radius:1.5rem;padding:2rem;margin-bottom:1.5rem;box-shadow:0 8px 25px -8px rgba(0,100,0,0.15);border:2px solid #C5A84C;"><div class="noor-canvas-logo" style="display:flex;align-items:center;justify-content:center;text-align:center;margin-bottom:1.5rem;"><img src="/images/NoorCanvas.png?v=20250924" alt="NOOR Canvas"></div><!--!-->
    <!--!--><h1 style="font-size:2.5rem;font-weight:800;background:linear-gradient(135deg,#006400,#059669);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:center;gap:0.75rem;letter-spacing:-0.025em;"><i class="fa-solid fa-gear" style="color:#006400;font-size:2.25rem;"></i>
        <span>HOST CONTROL PANEL</span></h1>
    <!--!--><p style="color:#6B7280;font-size:1rem;font-weight:500;margin:0;">Manage your session with professional-grade controls</p></header><!--!-->

        
        <!--!--><div id="noor-error-panel" style="display:none;background:linear-gradient(135deg,#FEF2F2,#FECACA);border:2px solid #DC2626;border-radius:1rem;padding:1.5rem;margin-bottom:1rem;box-shadow:0 10px 15px -3px rgba(220,38,38,0.1);"><div style="display:flex;align-items:flex-start;gap:1rem;"><!--!--><div style="flex-shrink:0;background:#DC2626;color:white;width:2.5rem;height:2.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-exclamation-triangle" style="font-size:1.125rem;"></i></div>
        <div style="flex:1;min-width:0;"><h4 style="font-weight:700;font-size:1.125rem;color:#DC2626;margin:0 0 0.5rem 0;display:flex;align-items:center;gap:0.5rem;"><span>System Error Detected</span><span style="font-size:0.75rem;font-weight:400;color:#6B7280;">14:20:29</span></h4><!--!-->
            <div style="background:rgba(255,255,255,0.8);border-radius:0.5rem;padding:1rem;margin-bottom:1rem;border:1px solid #FCA5A5;"><div style="font-family:monospace;font-size:0.875rem;color:#374151;word-break:break-all;white-space:pre-wrap;"></div></div><!--!-->
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;"><button style="padding:0.5rem 1rem;background:#DC2626;color:white;border:none;border-radius:0.5rem;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:0.5rem;" onmouseover="this.style.backgroundColor='#B91C1C'" onmouseout="this.style.backgroundColor='#DC2626'"><!--!--><i class="fa-solid fa-copy"></i>
                    <!--!--><span>Copy Error</span></button><!--!-->
                <button style="padding:0.5rem 1rem;background:#6B7280;color:white;border:none;border-radius:0.5rem;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:0.5rem;" onmouseover="this.style.backgroundColor='#4B5563'" onmouseout="this.style.backgroundColor='#6B7280'"><!--!--><i class="fa-solid fa-times"></i>
                    <!--!--><span>Dismiss</span></button></div></div></div></div><!--!--><div class="host-main-container" style="display:flex;gap:1.5rem;width:100%;min-height:600px;align-items:stretch;min-width:0;"><div class="host-transcript-panel" style="flex:1 1 100%;background-color:white;border-radius:1.5rem;box-shadow:inset 0 2px 4px 0 rgba(0,0,0,0.06);border:2px solid #C5A84C;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;min-width:0;"><div style="position:sticky; top:1rem; z-index:20; display:flex;align-items:center;justify-content:center;gap:2rem;padding:1rem 1.5rem;background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-top:1px solid #006400;border-right:1px solid #006400;border-bottom:1px solid #006400;border-left:4px solid #006400;margin-bottom:15px;box-shadow:0 2px 8px rgba(0,100,0,0.1);font-family:'Roboto',sans-serif;"><h3 style="font-size:2rem;font-weight:700;color:#006400;margin:0;letter-spacing:-0.02em;font-family:'Roboto',sans-serif;">Need For Messengers</h3><div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem; margin-left:auto;"><div aria-label="Session elapsed time" style="display:flex; align-items:center; gap:0.5rem;"><span style="font-weight:700; font-family:'Consolas','Monaco','Courier New',monospace; font-size:3rem; letter-spacing:0.02em; color:#FF8C00;">1:14</span></div><!--!-->
                    <span style="font-size:0.75rem; color:#6B7280; font-family:'Roboto',sans-serif; font-weight:400;">Transcript Canvas</span></div><button type="button" aria-controls="hcp-qa-panel" aria-label="Toggle questions panel" style="position:relative; width:66px; height:66px; display:flex; align-items:center; justify-content:center; background-color:#006400; color:white; border:none; border-radius:50%; cursor:pointer; box-shadow:0 6px 12px rgba(0,100,0,0.25); transition:all 0.2s ease;" onmouseover="this.style.backgroundColor='#004d00'; this.style.transform='scale(1.05)'" onmouseout="this.style.backgroundColor='#006400'; this.style.transform='scale(1)'"><i class="fa-solid fa-question" style="font-size:2rem;"></i><!--!-->
                    <span aria-label="0 questions" style="position:absolute; top:-6px; right:-6px; min-width:28px; height:28px; padding:0 6px; display:inline-flex; align-items:center; justify-content:center; background-color:#DC2626; color:white; border-radius:999px; font-size:1rem; font-weight:800; font-family:'Poppins',sans-serif; box-shadow:0 2px 6px rgba(220,38,38,0.3);">0</span></button></div><!--!-->
        
    
    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;"><div id="transcript-content-container" style="flex:1;overflow-y:auto;border-radius:0.5rem;padding:1rem;min-width:0;" _bl_8913a584-3678-435f-96fb-4162052281c1=""><div class="html-viewer-content session-transcript-content islamic-content" data-theme="narrow"><!--!--><div class="transcript-content blazor-safe-html ks-transcript" data-theme="wide"><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-0" data-h2-index="0" data-h2-text="Impurity (نجاست) and Purification (طهارة)" data-noor-share-control="true" style="background-color: rgb(224, 194, 66); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-0" data-section-index="0" style="position: relative;"><h2 style="text-align: left;">Impurity (<span class="inlineArabic">نجاست</span>) and Purification (<span class="inlineArabic">طهارة</span>)</h2><p>Impurity (<span class="inlineArabic">نجاست</span>) arises from defilement, while purification (<span class="inlineArabic">طهارة</span>) is the process of moving from the state of impurity to that of purity. As human beings are composed of both body and soul, purification must encompass both: the body through physical cleansing and the soul through spiritual refinement. Outward rituals purify the body, while understanding their inner meanings purifies the soul.</p><p>Physical purification is achieved through water, whereas purification of the soul is attained through knowledge.</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-inserted-hadees-1" data-asset-type="inserted-hadees" data-instance-number="1" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="127" data-token="H|127" data-type="hadees" id="ahadees-1761422783462-850" data-asset-id="asset-inserted-hadees-1"><div class="hadees-header ks-ahadees-header"><h4><i class="fa fa-comment ks-ahadees-header-icon" aria-hidden="true"></i>Muhammad Ibn Abdullah (SWS)</h4></div><div class="hadees-arabic ks-ahadees-arabic">لَا صَلَاةَ إِلَّا بِالطَّهَارَةِ</div><div class="hadees-english ks-ahadees-english">There is no prayer without purification.</div></div><p>Ablution (<span class="inlineArabic">وضوء</span>) is the process by which the body expels impurities and prepares for worship. It also signifies recognition of the sacred boundaries of the Imam (<span class="inlineArabic">إمام</span>), while prayer (<span class="inlineArabic">صلاة</span>) represents standing within the Imam’s summons through those boundaries. Since participation in the Imam’s call is impossible without first knowing his appointed limits, prayer (<span class="inlineArabic">صلاة</span>) is invalid without ablution (<span class="inlineArabic">وضوء</span>).</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-inserted-hadees-2" data-asset-type="inserted-hadees" data-instance-number="2" type="button" style="border: 2px solid rgb(59, 130, 246); padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative; transform: scale(1.05); background-color: rgb(59, 130, 246); color: white;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fa-solid fa-share"></i> SHARE AYAT CARD #1</button></div><div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="128" data-token="H|128" data-type="hadees" id="ahadees-1761422783462-851" data-asset-id="asset-inserted-hadees-2"><div class="hadees-header ks-ahadees-header"><h4><i class="fa fa-comment ks-ahadees-header-icon" aria-hidden="true"></i>Muhammad Ibn Abdullah (SWS)</h4></div><div class="hadees-arabic ks-ahadees-arabic">الطَّهَارَةُ نِصْفُ الْإِيمَانِ</div><div class="hadees-english ks-ahadees-english">Purification is half of faith.</div></div><p>The Messenger of Allah (ﷺ) also said that whoever completes his purification (<span class="inlineArabic">طهارة</span>) and then sets out from his home toward the mosque to perform prayer (<span class="inlineArabic">صلاة</span>), remains in a state of prayer (<span class="inlineArabic">صلاة</span>) until his ablution (<span class="inlineArabic">وضوء</span>) breaks. Thus, ablution is the gateway to divine illumination, by which the believer receives spiritual aid from the Imam (<span class="inlineArabic">إمام</span>).</p><p></p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-imgResponsive-1" data-asset-type="imgResponsive" data-instance-number="1" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><img src="https://resources.kashkole.com/IMAGES/212/34fca08b-43b3-4d46-b346-0a50d8ceac6d.jpg" class="fr-fic fr-dib imgResponsive fr-bordered" data-type="image" data-image-id="34fca08b-43b3-4d46-b346-0a50d8ceac6d" data-session-id="212" data-insertion-id="299a431f-3ed5-4560-904e-8f3d4aa36364" data-content-type="image" data-islamic-content="" data-asset-id="asset-imgResponsive-1"></div><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-1" data-h2-index="1" data-h2-text="The Symbolism of Ablution (وضوء)" data-noor-share-control="true" style="background-color: rgb(255, 215, 0); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-1" data-section-index="1" style="position: relative;"><h2 style="text-align: left;">The Symbolism of Ablution (<span class="inlineArabic">وضوء</span>)</h2><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-inserted-hadees-3" data-asset-type="inserted-hadees" data-instance-number="3" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="128" data-token="H|128" data-type="hadees" id="ahadees-1761422783462-851" data-asset-id="asset-inserted-hadees-3"><div class="hadees-header ks-ahadees-header"><h4><i class="fa fa-comment ks-ahadees-header-icon" aria-hidden="true"></i>Muhammad Ibn Abdullah (SWS)</h4></div><div class="hadees-arabic ks-ahadees-arabic">الصَّلَاةُ أُسِّسَتْ عَلَى أَرْبَعٍ: الْوُضُوءِ، وَالرُّكُوعِ، وَالسُّجُودِ، وَالْخُشُوعِ</div><div class="hadees-english ks-ahadees-english">Prayer is founded upon four things: ablution, bowing, prostration, and humility. Whoever neglects them, his prayer is deception.</div></div><p>Among these four obligations, the perfection of Ablution (<span class="inlineArabic">وضوء</span>) is the first and most vital. Its perfection lies in repeating each act three times. Water (<span class="inlineArabic">ماء</span>) symbolizes the good deeds of the believers, which Allah has divided into three portions. Therefore,&nbsp;</p><ul><li>Each limb in ablution is washed three times,&nbsp;</li><li>Just as one drinks water in three sips.&nbsp;</li><li>Knowledge too has three dimensions — the Law (<span class="inlineArabic">شریعت</span>), the Interpretation (<span class="inlineArabic">تأویل</span>), and the Realities (<span class="inlineArabic">حقائق</span>).</li></ul><h3>Ablution as the Gnosis of Three Spiritual States</h3><p></p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-imgResponsive-2" data-asset-type="imgResponsive" data-instance-number="2" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><img src="https://resources.kashkole.com/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg" class="fr-fic fr-dib imgResponsive fr-bordered" data-type="image" data-image-id="6cfa2ba3-9ae1-44d1-b38d-357ae051450c" data-session-id="2343" data-insertion-id="9e9f21ba-457c-41d6-8a78-3047e590677f" data-content-type="image" data-islamic-content="" data-asset-id="asset-imgResponsive-2"><p></p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-imgResponsive-3" data-asset-type="imgResponsive" data-instance-number="3" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><img src="https://resources.kashkole.com/IMAGES/212/15b3dc8a-f702-4f7b-abc0-e73bae74723f.jpg" class="fr-fic fr-dib imgResponsive fr-bordered" data-type="image" data-image-id="15b3dc8a-f702-4f7b-abc0-e73bae74723f" data-session-id="212" data-insertion-id="b321ed68-0288-4bbf-a06f-90a0a8ec0541" data-content-type="image" data-islamic-content="" data-asset-id="asset-imgResponsive-3"><p>The ritual performance of ablution (<span class="inlineArabic">وضوء</span>) offers a clear structure for understanding the spiritual journey, demonstrating the concept of esoteric interpretation (<span class="inlineArabic">تأويل</span>) where the external act (<span class="inlineArabic">ظاهر</span>) guides us to the inner truth (<span class="inlineArabic">باطن</span>). Each of the three repetitions corresponds to the <strong>gnosis (deep, spiritual knowledge)</strong> and the acceptance of a specific spiritual authority or state.</p><h4>First Repetition: Gnosis of Sincerity and the Guide (<span class="inlineArabic">داعي</span>)</h4><p>The <strong>first repetition</strong> symbolizes the believer's recognition of the absolute need for <strong>sincerity</strong> (<span class="inlineArabic">نية</span>) in spiritual life and the acceptance of the <strong>Spiritual Guide (<span class="inlineArabic">داعي</span>)</strong>. The <span class="inlineArabic">داعي</span> is an authorized teacher and representative of the Imam, acting as the primary point of contact for new spiritual seekers. The act acknowledges that the journey must be founded on a pure, honest heart, a sincerity that is perceived and validated by the <span class="inlineArabic">داعي</span>. This is the necessary first step: realizing that the starting point is a pure intention and accepting the human teacher who initiates one into the path.</p><h4>Second Repetition: Gnosis of Guardianship (<span class="inlineArabic">ولایت</span>) and the Imam (<span class="inlineArabic">إمام الزمان</span>)</h4><p>The <strong>second repetition</strong> marks the ascent to a higher level: the recognition and gnosis of the fundamental doctrine of <strong>Guardianship (<span class="inlineArabic">ولایت</span>)</strong> under the <strong>Imam of the Age (<span class="inlineArabic">إمام الزمان</span>)</strong>. Achieving this level grants the believer a <strong>double reward</strong> and permanent spiritual protection. This is the crucial stage where the believer fully realizes that the Imam is the living proof (<span class="inlineArabic">حجة</span>) of Allah on Earth and the source of esoteric truth. It is through submission to the Imam's sacred authority (<span class="inlineArabic">ولایت</span>) that the soul undergoes its necessary <strong>inner purification</strong> from spiritual impurities.</p><h4>Third Repetition: Gnosis of Prophecy (<span class="inlineArabic">نبوة</span>) and Perfection (<span class="inlineArabic">كمال</span>)</h4><p>The <strong>third repetition</strong> culminates the ascent in the supreme recognition and gnosis of the spiritual state of <strong>Prophecy (<span class="inlineArabic">نبوة</span>)</strong>, leading to <strong>Perfection (<span class="inlineArabic">كمال</span>)</strong>. At this ultimate stage, the act symbolizes the believer's spiritual completion and alignment with the (<span class="inlineArabic">ناطق</span>), the ultimate source of divine law and wisdom. This gnosis is so profound that the Prophet (<span class="inlineArabic">ناطق</span>) confirms it directly, declaring the ablution as his own and that of all Prophets. By aligning their perfect spiritual act with the <strong>universal prophetic light</strong>, the believer's soul achieves the highest possible state of human intellectual and spiritual completeness.</p><p>To purify each limb three times symbolizes the believer’s recognition of the three essential ranks of the spiritual hierarchy: the Guide (<span class="inlineArabic">داعی</span>), the Imam (<span class="inlineArabic">إمام</span>), and the Prophet (<span class="inlineArabic">ناطق</span>). Through this recognition, one becomes included among the boundaries of the faith and rises toward completeness in devotion.</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-1" data-asset-type="table" data-instance-number="1" type="button" style="border: 2px solid rgb(59, 130, 246); padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative; transform: scale(1); background-color: rgb(59, 130, 246); color: white;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fa-solid fa-share"></i> SHARE AYAT CARD #1</button></div><table data-asset-id="asset-table-1"><thead><tr><th style="text-align: center;">First Repetition</th><th style="text-align: center;">Second Repetition</th><th style="text-align: center;">Third Repetition</th></tr></thead><tbody><tr><td style="text-align: center;">Gnosis of the <span class="inlineArabic">داعی</span>(Guide)</td><td style="text-align: center;">Gnosis of (Guardianship) of <span class="inlineArabic">إمام الزمان</span></td><td style="text-align: center;">Gnosis of the <span class="inlineArabic">ناطق</span> (Prophet)</td></tr><tr><td style="text-align: center;">Outward Purity</td><td style="text-align: center;">Inward Purity</td><td style="text-align: center;">Perfection</td></tr></tbody></table></div><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-2" data-h2-index="2" data-h2-text="The Seven Acts of Purification" data-noor-share-control="true" style="background-color: rgb(255, 215, 0); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-2" data-section-index="2" style="position: relative;"><h2 style="text-align: left;">The Seven Acts of Purification</h2><p>Purification (<span class="inlineArabic">طہارت</span>) relates to the cleansing of seven bodily members. Of these, four are obligatory (<span class="inlineArabic">فرض</span>) and three are recommended (<span class="inlineArabic">سنت</span>). Every act of purification corresponds to a limit or boundary within both the physical and spiritual invitation (<span class="inlineArabic">دعوت</span>).</p><p></p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-imgResponsive-4" data-asset-type="imgResponsive" data-instance-number="4" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><img src="https://resources.kashkole.com/IMAGES/2343/0bae0475-f5de-4d3d-8c83-134d16da18b7.jpg" class="fr-fic fr-dib imgResponsive fr-bordered" data-type="image" data-image-id="0bae0475-f5de-4d3d-8c83-134d16da18b7" data-session-id="2343" data-insertion-id="9034b47c-f060-4e89-baa4-ece3034a79f1" data-content-type="image" data-islamic-content="" data-asset-id="asset-imgResponsive-4"><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-2" data-asset-type="table" data-instance-number="2" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><table data-asset-id="asset-table-2"><tbody><tr><td style="width: 3.6545%;">1</td><td style="width: 24.9444%;">Washing the hands (<span class="inlineArabic">يدين</span>)</td><td style="width: 71.34%;">The Guide (<span class="inlineArabic">داعی</span>)</td></tr><tr><td style="width: 3.6545%;">2</td><td style="width: 24.9444%;">Rinsing the mouth (<span class="inlineArabic">مضمضة</span>)</td><td style="width: 71.34%;">The Proof (<span class="inlineArabic">حجت</span>)</td></tr><tr><td style="width: 3.6545%;">3</td><td style="width: 24.9444%;">Cleaning the nose (<span class="inlineArabic">استنشاق</span>)</td><td style="width: 71.34%;">The Imam (<span class="inlineArabic">إمام</span>)</td></tr><tr><td style="width: 3.6545%;">4</td><td style="width: 24.9444%;">Washing the face (<span class="inlineArabic">وجه</span>)</td><td style="width: 71.34%;">The Prophet (<span class="inlineArabic">ناطق</span>)</td></tr><tr><td style="width: 3.6545%;">5</td><td style="width: 24.9444%;">Washing both arms (<span class="inlineArabic">ذراعين</span>)</td><td style="width: 71.34%;">The Foundation (<span class="inlineArabic">أساس</span>)</td></tr><tr><td style="width: 3.6545%;">6</td><td style="width: 24.9444%;">Wiping the head (<span class="inlineArabic">رأس</span>)</td><td style="width: 71.34%;">The Universal Intellect (<span class="inlineArabic">عقل کل</span>)</td></tr><tr><td style="width: 3.6545%;">7</td><td style="width: 24.9444%;">Wiping both feet (<span class="inlineArabic">رجلين</span>)</td><td style="width: 71.34%;">The Universal Soul (<span class="inlineArabic">نفس کل</span>)</td></tr></tbody></table><p>Beyond these seven acts, ablution (<span class="inlineArabic">وضوء</span>) involves touching water upon the face, arms, and feet — again totaling seven limbs. These seven limits mirror seven <span class="inlineArabic">نطقاء</span> (Prophets), seven <span class="inlineArabic">أئمہ</span> (Imams), and seven <span class="inlineArabic">أساس</span> (Foundations), and further symbolize the seven ranks in the spiritual hierarchy stretching from the believer to the Imam.</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-3" data-asset-type="table" data-instance-number="3" type="button" style="border: 2px solid rgb(59, 130, 246); padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative; transform: scale(1); background-color: rgb(59, 130, 246); color: white;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fa-solid fa-share"></i> SHARE AYAT CARD #1</button></div><table data-asset-id="asset-table-3"><thead><tr><th>Rank</th><th>Symbolic Association</th></tr></thead><tbody><tr><td>1. Imam (<span class="inlineArabic">إمام</span>)</td><td>Representative of Divine authority</td></tr><tr><td>2. Proof (<span class="inlineArabic">حجت</span>)</td><td>Bearer of inner demonstration</td></tr><tr><td>3. Possessor of Contact (<span class="inlineArabic">ذو مصة</span>)</td><td>Bridge between Proof and Gate</td></tr><tr><td>4. Gate (<span class="inlineArabic">باب</span>)</td><td>Threshold to the higher realms</td></tr><tr><td>5. Guide (<span class="inlineArabic">داعی</span>)</td><td>Deputy of the Imam</td></tr><tr><td>6. Caller (<span class="inlineArabic">مكلّب</span>)</td><td>Assistant to the Guide</td></tr><tr><td>7. Believer (<span class="inlineArabic">مؤمن</span>)</td><td>Recipient of initiation</td></tr></tbody></table><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-esotericBlock-1" data-asset-type="esotericBlock" data-instance-number="1" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><div class="esotericBlock" data-asset-id="asset-esotericBlock-1"><div class="esoteric-header"><i class="fa fa-eye" aria-hidden="true"></i><span class="esoteric-title">ESOTERICS</span></div><div class="esotericData"><p>The three recommended acts — washing the hands, rinsing the mouth, and cleansing the nose — precede the four obligatory ones. This order reflects the manner in which three secondary limits (the <span class="inlineArabic">داعی</span>, the <span class="inlineArabic">حجت</span>, and the <span class="inlineArabic">إمام</span>) are established by the four cosmic principles (<span class="inlineArabic">عقل کل</span>, <span class="inlineArabic">نفس کل</span>, <span class="inlineArabic">ناطق</span>, <span class="inlineArabic">أساس</span>). The sequence thus parallels the phrase “In the name of Allah, the Most Gracious, the Most Merciful” (<span class="inlineArabic">بسم الله الرحمن الرحيم</span>): first the three letters of <span class="inlineArabic">بسم</span>, then the four letters of <span class="inlineArabic">اللہ</span>.</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-4" data-asset-type="table" data-instance-number="4" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><table style="width: 100%;" data-asset-id="asset-table-4"><thead><tr><th style="text-align: center;"><span class="inlineArabic">ہ</span></th><th style="text-align: center;"><span class="inlineArabic">ل</span></th><th style="text-align: center;"><span class="inlineArabic">ل</span></th><th style="text-align: center;"><span class="inlineArabic">ا</span></th><th style="text-align: center;"><span class="inlineArabic">م</span></th><th style="text-align: center;"><span class="inlineArabic">س</span></th><th style="text-align: center;"><span class="inlineArabic">ب</span></th></tr></thead><tbody><tr><td style="width: 14.2857%; text-align: center;"><span class="inlineArabic">عقل کل</span></td><td style="width: 14.2857%; text-align: center;"><span class="inlineArabic">نفس کل</span></td><td style="width: 14.2857%; text-align: center;"><span class="inlineArabic">ناطق</span></td><td style="width: 14.2857%; text-align: center;"><span class="inlineArabic">اساس</span></td><td style="width: 14.2857%; text-align: center;"><span class="inlineArabic">مام</span></td><td style="width: 14.2857%; text-align: center;"><span class="inlineArabic">حجۃ</span></td><td style="width: 14.2857%; text-align: center;"><span class="inlineArabic">داعی</span></td></tr></tbody></table></div></div><p>In the order of the four obligatory acts, the washing of the face signifies the recognition of the <span class="inlineArabic">ناطق</span> (the speaking Prophet), followed by the arms representing the <span class="inlineArabic">أساس</span> (the Foundation), through whom the higher principles — the Universal Intellect (<span class="inlineArabic">عقل کل</span>) and the Universal Soul (<span class="inlineArabic">نفس کل</span>) — are acknowledged.</p><p><br></p><p>To perform these seven acts is to affirm that Allah’s Essence transcends all limits symbolized by the limbs. Each act is a testimony that the divine knowledge belongs to Him alone, and that all the spiritual boundaries are created to convey His wisdom into the souls of the believers.</p></div><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-3" data-h2-index="3" data-h2-text="The Order of Ablution (وضوء)" data-noor-share-control="true" style="background-color: rgb(224, 194, 66); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-3" data-section-index="3" style="position: relative;"><h2 style="text-align: left;">The Order of Ablution (<span class="inlineArabic">وضوء</span>)</h2><p>The sequence of ablution (<span class="inlineArabic">وضوء</span>) begins with cleansing from physical impurities and proceeds toward spiritual readiness. The first step is <strong>Taghawut</strong> (<span class="inlineArabic">تغاوط</span>) — expelling bodily waste and filth. This is followed by <strong>Istinja</strong> (<span class="inlineArabic">استنجا</span>), the act of washing and purifying the private parts, after which the true stages of purification commence.</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-5" data-asset-type="table" data-instance-number="5" type="button" style="border: 2px solid rgb(59, 130, 246); padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative; transform: scale(1); background-color: rgb(59, 130, 246); color: white;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fa-solid fa-share"></i> SHARE AYAT CARD #1</button></div><table data-asset-id="asset-table-5"><thead><tr><th>#</th><th>Act of Ablution</th></tr></thead><tbody><tr><td>1</td><td>Expelling impurities – <span class="inlineArabic">تغاوط</span></td></tr><tr><td>2</td><td>Cleansing after relieving oneself – <span class="inlineArabic">استنجا</span></td></tr><tr><td>3</td><td>Washing both hands</td></tr><tr><td>4</td><td>Rinsing the mouth and using the miswak</td></tr><tr><td>5</td><td>Intention – <span class="inlineArabic">نية</span></td></tr><tr><td>6</td><td>Drawing water into the nose</td></tr><tr><td>7</td><td>Washing the face</td></tr><tr><td>8</td><td>Washing both arms up to the elbows</td></tr><tr><td>9</td><td>Wiping the head</td></tr><tr><td>10</td><td>Wiping the ears</td></tr><tr><td>11</td><td>Wiping the neck</td></tr><tr><td>12</td><td>Wiping both feet</td></tr></tbody></table><h3>Obligatory Acts of Ablution (<span class="inlineArabic">فرائض الوضوء</span>)</h3><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-6" data-asset-type="table" data-instance-number="6" type="button" style="border: 2px solid rgb(59, 130, 246); padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative; transform: scale(1); background-color: rgb(59, 130, 246); color: white;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fa-solid fa-share"></i> SHARE AYAT CARD #1</button></div><table data-asset-id="asset-table-6"><thead><tr><th>#</th><th>Obligation</th></tr></thead><tbody><tr><td>1</td><td>Pure water</td></tr><tr><td>2</td><td>Intention (<span class="inlineArabic">نية</span>)</td></tr><tr><td>3</td><td>Washing the face</td></tr><tr><td>4</td><td>Washing both arms</td></tr><tr><td>5</td><td>Wiping the head</td></tr><tr><td>6</td><td>Wiping both feet</td></tr><tr><td>7</td><td>Maintaining proper sequence</td></tr></tbody></table><h3>Recommended Acts of Ablution (<span class="inlineArabic">سنن الوضوء</span>)</h3><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-7" data-asset-type="table" data-instance-number="7" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><table data-asset-id="asset-table-7"><thead><tr><th>#</th><th>Recommended Act</th></tr></thead><tbody><tr><td>1</td><td>Performing Istinja</td></tr><tr><td>2</td><td>Washing hands before placing them in the vessel</td></tr><tr><td>3</td><td>Beginning ablution with “Bismillah al-Rahman al-Rahim” (<span class="inlineArabic">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</span>)</td></tr><tr><td>4</td><td>Rinsing the mouth</td></tr><tr><td>5</td><td>Drawing water into the nose</td></tr><tr><td>6</td><td>Rotating the ring on one’s finger</td></tr><tr><td>7</td><td>Passing fingers through the beard</td></tr><tr><td>8</td><td>Pouring water over the eyes</td></tr><tr><td>9</td><td>Washing the right limbs before the left</td></tr><tr><td>10</td><td>Repeating washing two or three times</td></tr><tr><td>11</td><td>Wiping both ears</td></tr></tbody></table><p>The sequence of these acts illustrates the gradual ascent from material to spiritual purity. The believer begins by removing physical defilement, then moves through cleansing gestures that mirror spiritual refinement. The acts of rinsing, washing, and wiping each limb are reflections of stages in spiritual awareness, each purging a deeper level of impurity from the soul.</p><p>Through this progression, ablution becomes both a discipline of the body and a parable of the soul’s journey toward divine nearness. Each limb corresponds to a spiritual organ, and every act of cleansing testifies to the believer’s intent to align outward conduct with inner faith.</p></div><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-4" data-h2-index="4" data-h2-text="The Source and Nature of Purifying Water (ماء)" data-noor-share-control="true" style="background-color: rgb(255, 215, 0); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-4" data-section-index="4" style="position: relative;"><h2 style="text-align: left;">The Source and Nature of Purifying Water (<span class="inlineArabic">ماء</span>)</h2><p>Water – <span class="inlineArabic">ماء</span> – was sent down from the heavens to the earth by divine command, as Allah the Exalted declares in the Qur’an:</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-ayah-card-1" data-asset-type="ayah-card" data-instance-number="1" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><div class="ayah-card" id="ayah-card-23-18" data-asset-id="asset-ayah-card-1"><div class="golden-surah-header clickable-ayah-header" data-ayats="18" data-original-token="Q|23:18" data-surah="23" id="ayah-header-23-18"><span>The Believers (23:18).</span></div><p class="ayah-arabic">‏ وَأَنزَلْنَا مِنَ السَّمَاءِ مَاءًۭ بِقَدَرٍۢ فَأَسْكَنَّٰهُ فِى ٱلْأَرْضِ وَإِنَّا عَلَىٰ ذَهَابٍۢ بِهِۦ لَقَٰدِرُونَ ‎</p><div class="translation-header">Translation:.</div><p class="ayah-translation">And We sent down water from the sky in due measure, then lodged it in the earth, and indeed We are able to take it away.</p></div><p>Water flows through both pure and impure places. The pure include rivers, ponds, and wells; the impure include the salty seas. When water passes through corrupted locations, though its origin is pure, the impurity of the place affects it, altering its sweetness and clarity. It then loses its power to nourish or sustain life. The once-living water becomes bitter, saline, and destructive.</p><p>Purification (<span class="inlineArabic">طهارة</span>) is described as the gateway to prayer (<span class="inlineArabic">صلاة</span>), just as faith (<span class="inlineArabic">إيمان</span>) is the gateway to Islam (<span class="inlineArabic">إسلام</span>). Every visible act has a hidden reality, and each outward ritual has an inward meaning.</p><p>Allah the Almighty says in the Qur’an:</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-ayah-card-2" data-asset-type="ayah-card" data-instance-number="2" type="button" style="border: 2px solid rgb(59, 130, 246); padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative; transform: scale(1); background-color: rgb(59, 130, 246); color: white;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fa-solid fa-share"></i> SHARE AYAT CARD #1</button></div><div class="ayah-card" id="ayah-card-25-48" data-asset-id="asset-ayah-card-2"><div class="golden-surah-header clickable-ayah-header" data-ayats="48" data-original-token="Q|25:48" data-surah="25" id="ayah-header-25-48"><span>The Criterion (25:48).</span></div><p class="ayah-arabic">‏ وَهُوَ ٱلَّذِىٓ أَرْسَلَ ٱلرِّيَاحَ بُشْرًۭا بَيْنَ يَدَىْ رَحْمَتِهِۦ ۚ وَأَنزَلْنَا مِنَ ٱلسَّمَآءِ مَآءًۭ طَهُورًۭا ‎</p><div class="translation-header">Translation:.</div><p class="ayah-translation">And He it is Who sends the winds as glad tidings before His mercy, and We send down from the sky pure water.</p></div><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-ayah-card-3" data-asset-type="ayah-card" data-instance-number="3" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><div class="ayah-card" id="ayah-card-8-11" data-asset-id="asset-ayah-card-3"><div class="golden-surah-header clickable-ayah-header" data-ayats="11" data-original-token="Q|8:11" data-surah="8" id="ayah-header-8-11"><span>The Spoils of War (8:11).</span></div><p class="ayah-arabic">‏ إِذْ يُغَشِّيكُمُ ٱلنُّعَاسَ أَمَنَةًۭ مِّنْهُ وَيُنَزِّلُ عَلَيْكُم مِّنَ ٱلسَّمَآءِ مَآءًۭ لِّيُطَهِّرَكُم بِهِۦ وَيُذْهِبَ عَنكُمْ رِجْزَ ٱلشَّيْطَـٰنِ وَلِيَرْبِطَ عَلَىٰ قُلُوبِكُمْ وَيُثَبِّتَ بِهِ ٱلْأَقْدَامَ ‎</p><div class="translation-header">Translation:.</div><p class="ayah-translation">When He caused drowsiness to overcome you as a reassurance from Him, and sent down water from the sky to purify you, to remove from you the filth of Satan, to strengthen your hearts, and to make your feet firm.</p></div><p>The inner meaning of these verses reveals that water symbolizes divine knowledge. Just as physical impurities are washed away with pure water, the impurities of the soul—ignorance, doubt, and heedlessness—are removed through sacred knowledge. Hence, just as prayer is invalid without physical purification, so spiritual instruction is invalid without the inner covenant (<span class="inlineArabic">عهد</span>) and the guidance of the Imam (<span class="inlineArabic">إمام</span>).</p><p>Pure water cleanses filth, while tainted water cannot. This teaches that true knowledge must come from a pure source free of distortion. In this light, performing ablution with pure water signifies the believer’s connection to divine knowledge through the Imam and his rightful representatives.</p><p>In summary, physical water symbolizes revealed knowledge; its flow from heaven to earth symbolizes the descent of divine truth from higher to lower realms. Ablution with such water represents both the cleansing of the body and the enlightenment of the soul.</p></div><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-5" data-h2-index="5" data-h2-text="The Inner Meaning of Purification (طهارة)" data-noor-share-control="true" style="background-color: rgb(255, 215, 0); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-5" data-section-index="5" style="position: relative;"><h2 style="text-align: left;">The Inner Meaning of Purification (<span class="inlineArabic">طهارة</span>)</h2><p>Purification (<span class="inlineArabic">طهارة</span>) is valid only with pure water. If the water is mixed with any other substance, even fragrance or sweet syrup, it is no longer suitable for ablution (<span class="inlineArabic">وضوء</span>) or ritual bathing (<span class="inlineArabic">غسل</span>). Pure water removes impurity, but impure or mixed water cannot remove filth. This rule reflects the principle that divine knowledge must come from uncorrupted, authentic sources; corrupted teaching cannot cleanse the soul.</p><p>Ablution (<span class="inlineArabic">وضوء</span>) symbolizes the act of a believer entering the covenant (<span class="inlineArabic">عهد</span>) of the Imam of the Time (<span class="inlineArabic">إمام الزمان</span>), recognizing his sacred boundaries, and disavowing his enemies. The inner meaning of prayer (<span class="inlineArabic">صلاة</span>) is the believer’s union with the spiritual ranks of the Imam and his representatives. Just as prayer cannot be performed without ablution, inner knowledge cannot be imparted without first taking the sacred covenant, because the covenant is the inward reality of purification, and spiritual instruction is the inward reality of prayer.</p><p>Pure water symbolizes divine knowledge (<span class="inlineArabic">علم</span>), which cleanses the soul’s ignorance, just as water removes physical impurity from the body. Performing prayer without ablution is likened to seeking esoteric knowledge without first entering the Imam’s allegiance.</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-8" data-asset-type="table" data-instance-number="8" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><table data-asset-id="asset-table-8"><thead><tr><th>Purification (<span class="inlineArabic">طهارة</span>)</th><th>Prayer (<span class="inlineArabic">صلاة</span>)</th></tr></thead><tbody><tr><td>Covenant of the Imam of the Time – <span class="inlineArabic">عهد إمام الزمان</span></td><td>Knowledge of Esoteric Truths – <span class="inlineArabic">علم تأويل وحقائق</span></td></tr></tbody></table><p>When pure water is unavailable, purification may be done with salty or bitter water – <span class="inlineArabic">ماء مالح</span> – symbolizing the state of a believer living among the enemies of faith. Such a believer may conceal his true beliefs through dissimulation (<span class="inlineArabic">تقية</span>), aligning outwardly with false ideas for safety while keeping the truth preserved within. This corresponds to purifying oneself in difficult conditions when access to the pure source is obstructed.</p><p>Thus, the visible act of cleansing with water represents the hidden act of cleansing the soul with divine wisdom. The purity or impurity of water reflects the state of knowledge itself—pure when drawn from the Imam’s lineage, and corrupted when mixed with false teachings.</p></div><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-6" data-h2-index="6" data-h2-text="The Symbolism of Wells, Rivers, and Water Vessels" data-noor-share-control="true" style="background-color: rgb(255, 215, 0); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-6" data-section-index="6" style="position: relative;"><h2 style="text-align: left;">The Symbolism of Wells, Rivers, and Water Vessels</h2><p>When a worshipper prepares for prayer and seeks water for ablution (<span class="inlineArabic">وضوء</span>), he draws it from rivers or wells. The river represents the manifest knowledge of the true Imam (<span class="inlineArabic">إمام</span>), flowing openly for all who seek it. The well symbolizes the hidden or esoteric knowledge of the Imam’s Hujjat (<span class="inlineArabic">حجة</span>), accessible only to those who are spiritually near and capable of reaching its depth.</p><p>The bucket used to draw water from the well signifies the Dai of proclamation (<span class="inlineArabic">داعي بلاغ</span>), who learns from the Hujjat and brings forth that knowledge for others. The vessel into which this water is poured represents the Dai al-Mutlaq (<span class="inlineArabic">داعي المطلق</span>), who conveys this wisdom to the Muminin (<span class="inlineArabic">مؤمنين</span>) through appointed missionaries. The right and left hands drawing and distributing water symbolize the authorized ranks of <strong>Madhun</strong> (<span class="inlineArabic">مأذون</span>) and <strong>Mukasir</strong> (<span class="inlineArabic">مكاسر</span>).</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-9" data-asset-type="table" data-instance-number="9" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><table data-asset-id="asset-table-9"><thead><tr><th>Outer Symbol</th><th>Inner Meaning</th></tr></thead><tbody><tr><td>River water</td><td>The manifest knowledge of the Imam (<span class="inlineArabic">علم الإمام الظاهر</span>)</td></tr><tr><td>Well water</td><td>The hidden knowledge of the Imam’s Hujjat (<span class="inlineArabic">علم حجة الإمام الباطن</span>)</td></tr><tr><td>Bucket</td><td>The Dai of proclamation (<span class="inlineArabic">داعي بلاغ</span>)</td></tr><tr><td>Water vessel</td><td>The Dai al-Mutlaq (<span class="inlineArabic">داعي المطلق</span>)</td></tr><tr><td>Right hand</td><td>The Madhun (<span class="inlineArabic">مأذون</span>)</td></tr><tr><td>Left hand</td><td>The Mukasir (<span class="inlineArabic">مكاسر</span>)</td></tr></tbody></table><p>Each hand has five fingers, symbolizing the five daily prayers (<span class="inlineArabic">صلوات خمس</span>). The five fingers of the right hand represent the <em>times</em> of prayer, while the five of the left hand represent the <em>obligatory prayers</em> themselves. Just as both hands cooperate to perform cleansing, these ranks of dawat cooperate to purify the souls of the faithful.</p><p>The act of cleansing oneself with water after relieving impurities represents the removal of disbelief (<span class="inlineArabic">كفر</span>), idolatry (<span class="inlineArabic">شرك</span>), and hypocrisy (<span class="inlineArabic">نفاق</span>) through knowledge imparted by these ranks. Thus, ablution becomes a spiritual reflection of the missionary hierarchy, revealing how divine knowledge descends and circulates among believers through the Imam’s representatives.</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-table-10" data-asset-type="table" data-instance-number="10" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><table data-asset-id="asset-table-10"><thead><tr><th>Action</th><th>Inner Correspondence</th></tr></thead><tbody><tr><td>River</td><td>Knowledge of the Imam</td></tr><tr><td>Well</td><td>Knowledge of the Hujjat</td></tr><tr><td>Bucket</td><td>Dai of proclamation</td></tr><tr><td>Vessel</td><td>Dai al-Mutlaq</td></tr><tr><td>Right hand’s five fingers</td><td>Five times of prayer</td></tr><tr><td>Left hand’s five fingers</td><td>Five obligatory prayers</td></tr><tr><td>Cleansing after impurity</td><td>Removal of disbelief, idolatry, and hypocrisy</td></tr></tbody></table></div><div class="share-wrapper" data-noor-share-control="true" style="background-color: rgb(247, 243, 224); border: 1px solid rgb(153, 153, 153); padding: 20px; margin: 30px 0px; width: 100%; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="transcript-section-share-btn share-button" data-section-id="transcript-section-7" data-h2-index="7" data-h2-text="The Purity and Nature of Water (ماء)" data-noor-share-control="true" style="background-color: rgb(255, 215, 0); border: 1px solid rgb(224, 194, 66); color: rgb(85, 85, 85); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: background-color 0.1s; margin: 0px; width: 200px;"><i class="fas fa-share-alt" style="margin-right: 8px; color: #888;"></i>Share Section</button></div><div id="transcript-section-7" data-section-index="7" style="position: relative;"><h2 style="text-align: left;">The Purity and Nature of Water (<span class="inlineArabic">ماء</span>)</h2><p>Water (<span class="inlineArabic">ماء</span>) by its nature is pure and purifying—it cleanses others but never needs cleansing itself. Allah purifies the body from physical impurities through water and purifies the mind from ignorance through knowledge (<span class="inlineArabic">علم</span>). Attaining knowledge from the Ahl al-Bayt (<span class="inlineArabic">أهل البيت</span>) cleanses the soul from the impurity of ignorance and constitutes the true essence of purity (<span class="inlineArabic">طهارة</span>).</p><p>This meaning is affirmed in the Verse of Purification, where Allah the Exalted declares:</p><div class="action-wrapper" data-noor-share-control="true" style="background-color: #e6f2ff; border: 1px solid #0056b3; padding: 20px; margin-top: 30px; margin-bottom: 30px; width: 100%; margin-left: 0; margin-right: 0; box-sizing: border-box; border-radius: 8px; display: flex; justify-content: center;"><button class="shared-action-button" data-share-button="asset" data-noor-share-control="true" data-share-id="asset-ayah-card-4" data-asset-type="ayah-card" data-instance-number="4" type="button" style="background-color: rgb(59, 130, 246); border: 2px solid rgb(59, 130, 246); color: white; padding: 8px 12px; border-radius: 6px; display: inline-block; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px; transition: 0.2s; margin: 4px; white-space: nowrap; width: 200px; min-width: 120px; text-align: center; z-index: 999999; position: relative;" onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';"><i class="fas fa-lightbulb" style="margin-right: 8px; color: white;"></i>Share Asset</button></div><div class="ayah-card" id="ayah-card-33-33" data-asset-id="asset-ayah-card-4"><div class="golden-surah-header clickable-ayah-header" data-ayats="33" data-original-token="Q|33:33" data-surah="33" id="ayah-header-33-33"><span>The Confederates (33:33).</span></div><p class="ayah-arabic">‏ إِنَّمَا يُرِيدُ ٱللَّهُ لِيُذْهِبَ عَنكُمُ ٱلرِّجْسَ أَهْلَ ٱلْبَيْتِ وَيُطَهِّرَكُمْ تَطْهِيرًۭا ‎</p><div class="translation-header">Translation:.</div><p class="ayah-translation">Indeed, Allah only intends to remove impurity from you, O people of the household, and to purify you thoroughly.</p></div><p>Purity is required only where impurity exists—but the Ahl al-Bayt were never impure, nor can impurity ever reach them. When this verse was revealed, the Prophet (<span class="inlineArabic">رسول الله</span>) gathered Ali (<span class="inlineArabic">علي</span>), Fatimah (<span class="inlineArabic">فاطمة</span>), Hasan (<span class="inlineArabic">حسن</span>), and Husayn (<span class="inlineArabic">حسين</span>) under his cloak and declared them his household (<span class="inlineArabic">أهل البيت</span>). When Lady Salma requested inclusion, the Prophet replied, “O Salma, you are upon goodness, but this cloak is for these five alone.”</p><p>In this act, the Prophet elevated the Ahl al-Bayt above all humanity, symbolizing their inherent purity and divine election. The cloak itself represented the shield of divine protection, signifying that any impurity lies outside it. The Prophet then clarified that it was not his favor that brought them honor, but rather their own merit and spiritual excellence that made them worthy of Allah’s purification.</p><p>The verse’s reference to impurity (<span class="inlineArabic">رجس</span>) points to the errors and misconceptions believers may hold regarding the rank and reality of the Imams. Through divine knowledge, Allah purifies believers’ hearts from such misunderstandings, granting them the true recognition of the Ahl al-Bayt and the Imams descended from them.</p><p>The Ahl al-Bayt, being free from physical and spiritual impurity, perform purification not out of need but to symbolize the removal of veils (<span class="inlineArabic">حجب</span>) that obscure divine perception. Their ablution represents the cleansing of subtle spiritual obstacles, reminding believers that purification extends beyond the physical realm into the inner sanctity of the soul.</p></div></div></div></div></div><div style="display:flex;justify-content:center;margin-top:1rem;padding-top:1rem;border-top:1px solid #E5E7EB;"><button type="button" style="padding:0.75rem 2rem;border-radius:1rem;box-shadow:0 8px 12px -2px rgba(220,38,38,0.4);color:white;font-weight:600;font-size:1rem;background-color:#DC2626;border:none;cursor:pointer;opacity:1;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;gap:0.5rem;" onmouseover="this.style.backgroundColor='#B91C1C'; this.style.transform='scale(1.05)'" onmouseout="this.style.backgroundColor='#DC2626'; this.style.transform='scale(1)'"><!--!--><i class="fa-solid fa-stop" style="font-size:1rem;"></i><!--!--><span>End Session</span></button></div></div></div></div><!--!-->
        
    
    <!--!--></div><!--!--><div class="debug-panel collapsed" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;"><button class="debug-toggle-btn bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 ease-in-out" style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;"><i class="fas fa-bug text-lg text-white"></i></button></div><!--!-->


<script><!--!-->
    // Individual Asset Sharing Function (called by auto-injected SHARE buttons)
    window.shareIndividualAsset = async function(assetId, assetType) {
        console.log('NOOR-ASSET-SHARE: Sharing individual asset:', assetId, 'Type:', assetType);
        
        try {
            // Get session details (safely encoded using System.Text.Json)
            const sessionId = 212<!--!-->;
            const hostToken = "PQ9N5YWW"<!--!-->;
            
            if (!sessionId || !hostToken) {
                console.error('NOOR-ASSET-SHARE: Missing session ID or host token');
                alert('Session information not available. Please refresh the page.');
                return;
            }

            // Find the asset element
            const assetElement = document.querySelector(`[data-asset-id="${assetId}"]`);
            if (!assetElement) {
                console.error('NOOR-ASSET-SHARE: Asset element not found:', assetId);
                return;
            }

            // Find the SHARE button
            const shareButton = document.querySelector(`button[data-asset-id="${assetId}"]`);
            if (!shareButton) {
                console.error('NOOR-ASSET-SHARE: Share button not found for asset:', assetId);
                return;
            }

            // Visual feedback - button state
            const originalText = shareButton.textContent;
            const originalBg = shareButton.style.backgroundColor;
            shareButton.textContent = 'SHARING...';
            shareButton.style.backgroundColor = '#f59e0b';
            shareButton.disabled = true;

            // Call share API
            const shareResponse = await fetch('/api/host/share-asset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: parseInt(sessionId),
                    content: assetElement.outerHTML,
                    assetType: assetType,
                    assetId: assetId,
                    metadata: {
                        textContent: assetElement.textContent?.substring(0, 100) || '',
                        className: assetElement.className || '',
                        sharedAt: new Date().toISOString()
                    }
                })
            });

            if (shareResponse.ok) {
                const result = await shareResponse.json();
                console.log('NOOR-ASSET-SHARE: Asset shared successfully:', result);
                
                // Toast notification removed - visual feedback via button state is sufficient
                
                // Success feedback
                shareButton.textContent = '✓ SHARED';
                shareButton.style.backgroundColor = '#059669';
                
                setTimeout(() => {
                    shareButton.textContent = originalText;
                    shareButton.style.backgroundColor = originalBg;
                    shareButton.disabled = false;
                }, 3000);
                
            } else {
                throw new Error(`Share API returned ${shareResponse.status}`);
            }

        } catch (error) {
            console.error('NOOR-ASSET-SHARE: Error sharing asset:', assetId, error);
            
            // Show detailed error message to user
            let errorMessage = 'Unknown error occurred';
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            // Toast notification removed - visual feedback via button state is sufficient
            
            // Find button and show error feedback
            const shareButton = document.querySelector(`button[data-asset-id="${assetId}"]`);
            if (shareButton) {
                shareButton.textContent = '✗ ERROR';
                shareButton.style.backgroundColor = '#dc2626';
                shareButton.title = `Error: ${errorMessage}`;
                
                setTimeout(() => {
                    shareButton.textContent = 'SHARE';
                    shareButton.style.backgroundColor = '#dc2626';
                    shareButton.disabled = false;
                    shareButton.title = 'Share this asset';
                }, 3000);
            }
        }
    };

    // SignalR Asset Sharing Function (called by injected share buttons) - updated for individual assets
    window.shareAssetViaSignalR = async function(shareId, assetType, instanceCount, uniqueAssetId) {
        try {
            console.log('NOOR-ASSET-SIGNALR: Sharing individual asset via SignalR', { 
                shareId, assetType, instanceCount, uniqueAssetId 
            });
            
            if (window.signalRConnection && window.signalRConnection.state === 'Connected') {
                // Send individual asset share via SignalR hub with unique identifier
                const assetData = {
                    shareId: shareId,
                    assetType: assetType,
                    uniqueAssetId: uniqueAssetId,
                    instanceCount: 1 // Always 1 for individual assets
                };
                
                await window.signalRConnection.invoke('ShareAsset', window.currentSessionId, assetData);
                console.log('NOOR-ASSET-SIGNALR: Individual asset shared successfully via SignalR hub');
                
                // TOASTR: Show SignalR success notification
                if (typeof window.showNoorToast === 'function') {
                    window.showNoorToast(
                        `${assetType} #${instanceCount} shared via SignalR successfully!`, 
                        '✅ SignalR Share Complete', 
                        'success'
                    );
                    console.log('[DEBUG-WORKITEM:sharebutton-toastr] 📢 TOASTR: SignalR success notification shown');
                }
                
                // Show success feedback
                const button = document.querySelector(`[data-share-id="${shareId}"]`);
                if (button) {
                    const originalText = button.textContent;
                    button.textContent = '✅ SHARED VIA SIGNALR!';
                    button.style.backgroundColor = '#16a34a';
                    button.disabled = true;
                    
                    // Restore button after 3 seconds
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = '#dc2626';
                        button.disabled = false;
                    }, 3000);
                }
            } else {
                console.error('NOOR-ASSET-SIGNALR: SignalR connection not available or not connected');
                
                // TOASTR: Show SignalR connection error
                if (typeof window.showNoorToast === 'function') {
                    window.showNoorToast(
                        'SignalR connection is not available. Please refresh the page and try again.', 
                        'Connection Error', 
                        'error'
                    );
                    console.log('[DEBUG-WORKITEM:sharebutton-toastr] 📢 TOASTR: SignalR connection error shown');
                } else {
                    alert('SignalR connection is not available. Please refresh the page and try again.');
                }
            }
        } catch (error) {
            console.error('NOOR-ASSET-SIGNALR: Error sharing individual asset via SignalR:', error);
            
            // TOASTR: Show SignalR exception error
            if (typeof window.showNoorToast === 'function') {
                window.showNoorToast(
                    `Failed to share ${assetType} via SignalR: ${error.message}`, 
                    'SignalR Error', 
                    'error'
                );
                console.log('[DEBUG-WORKITEM:sharebutton-toastr] 📢 TOASTR: SignalR exception error shown:', error.message);
            } else {
                alert('Failed to share individual asset via SignalR: ' + error.message);
            }
        }
    };

    console.log('NOOR-ASSET-SHARE: Individual asset sharing system ready with SignalR support');

    // Toast Notification Functions for Q&A Alerts
    window.showQuestionToast = function(questionText) {
        // Create toast element
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-question-circle" style="color: #3B82F6; font-size: 1.2rem;"></i>
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">New Question Received!</div>
                    <div style="font-size: 0.875rem; opacity: 0.9; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${questionText}
                    </div>
                </div>
            </div>
        `;
        toast.style.cssText = `
            position: fixed; 
            top: 1rem; 
            right: 1rem; 
            background-color: #3B82F6; 
            color: white; 
            padding: 1rem 1.5rem; 
            border-radius: 0.75rem; 
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4); 
            z-index: 9999; 
            opacity: 0; 
            transform: translateX(100%); 
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            max-width: 400px;
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 4000);
    };

    window.showVoteUpdateToast = function(questionText, voteCount) {
        // Create toast element
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-thumbs-up" style="color: #10B981; font-size: 1.2rem;"></i>
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">Question Voted! (${voteCount} votes)</div>
                    <div style="font-size: 0.875rem; opacity: 0.9; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${questionText}
                    </div>
                </div>
            </div>
        `;
        toast.style.cssText = `
            position: fixed; 
            top: 1rem; 
            right: 1rem; 
            background-color: #10B981; 
            color: white; 
            padding: 1rem 1.5rem; 
            border-radius: 0.75rem; 
            box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); 
            z-index: 9999; 
            opacity: 0; 
            transform: translateX(100%); 
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            max-width: 400px;
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    };

    window.showErrorToast = function(errorMessage) {
        // Create error toast element
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2em;">⚠️</span>
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">Asset Sharing Error</div>
                    <div style="font-size: 0.9em; opacity: 0.9;">
                        ${errorMessage}
                    </div>
                </div>
            </div>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: linear-gradient(135deg, #DC2626, #B91C1C);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px rgba(220, 38, 38, 0.4);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            min-width: 350px;
            max-width: 500px;
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide toast after 5 seconds (longer for errors)
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 5000);
    };

    // Debug share toast function removed - preserving console logging only

    // Simplified clipboard handling - Blazor will handle copy operations directly via JSRuntime

    // Copy User Landing Link Function (Legacy - keeping for compatibility)
    window.copyUserLink = function() {
        const input = document.getElementById('userLinkInput');
        if (input) {
            input.select();
            input.setSelectionRange(0, 99999); // For mobile devices

            // Try using modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(input.value).then(() => {
                    console.log('NOOR-HOST-PANEL: User link copied to clipboard');
                    showCopyFeedback();
                }).catch(err => {
                    console.error('NOOR-HOST-PANEL: Failed to copy with clipboard API:', err);
                    // Fallback to execCommand
                    document.execCommand('copy');
                    showCopyFeedback();
                });
            } else {
                // Fallback for older browsers
                document.execCommand('copy');
                showCopyFeedback();
            }
        }
    };

    // Copy functionality is now handled entirely by Blazor via JSRuntime - no JavaScript manipulation needed

    // Error Display Panel Functions
    let currentError = null;

    function showErrorPanel(error, details = null) {
        console.log('[DEBUG-WORKITEM:hostcanvas:ui] Showing error panel:', error);
        
        currentError = {
            message: error.toString(),
            details: details || error.stack || 'No additional details available',
            timestamp: new Date().toISOString()
        };

        const panel = document.getElementById('noor-error-panel');
        const messageEl = document.getElementById('error-message');
        const timestampEl = document.getElementById('error-timestamp');
        const stackEl = document.getElementById('error-stack');

        if (panel && messageEl && timestampEl && stackEl) {
            messageEl.textContent = currentError.message;
            timestampEl.textContent = new Date(currentError.timestamp).toLocaleString();
            stackEl.textContent = currentError.details;
            panel.style.display = 'block';
            
            // Scroll to top to make error visible
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function dismissError() {
        const panel = document.getElementById('noor-error-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        currentError = null;
    }

    function toggleErrorDetails() {
        const details = document.getElementById('error-details');
        if (details) {
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
    }

    async function copyErrorToClipboard() {
        if (!currentError) return;
        
        const errorReport = `NOOR Canvas Error Report
Generated: ${currentError.timestamp}
Host Control Panel - Asset Sharing Error

Error Message:
${currentError.message}

Technical Details:
${currentError.details}

Page URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please share this report with the development team for debugging.`;

        try {
            await navigator.clipboard.writeText(errorReport);
            
            const button = document.getElementById('copy-error-btn');
            if (button) {
                const originalContent = button.innerHTML;
                button.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
                button.style.backgroundColor = '#059669';
                
                setTimeout(() => {
                    button.innerHTML = originalContent;
                    button.style.backgroundColor = '#DC2626';
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy error report:', err);
            // Fallback: show in a modal/alert
            alert('Copy failed. Please manually copy:\n\n' + errorReport);
        }
    }

    // Global error handler to catch unhandled errors
    window.addEventListener('error', function(event) {
        console.error('[DEBUG-WORKITEM:hostcanvas:error] Global error caught:', event.error);
        showErrorPanel(event.error || event.message, event.error?.stack);
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        console.error('[DEBUG-WORKITEM:hostcanvas:error] Unhandled promise rejection:', event.reason);
        showErrorPanel(event.reason, event.reason?.stack);
    });

    // Override console.error to capture application errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        
        // Show error panel for specific error patterns
        const errorMessage = args.join(' ');
        if (errorMessage.includes('NOOR-') || errorMessage.includes('ShareAsset') || errorMessage.includes('SignalR')) {
            showErrorPanel(errorMessage, 'Console error captured by error display system');
        }
    };

    // Share button handler setup
    function setupShareButtonHandlers(dotNetObjectRef) {
        const handlerSetupTime = new Date();
        const timeString = handlerSetupTime.toLocaleTimeString() + '.' + handlerSetupTime.getMilliseconds().toString().padStart(3, '0');
        
        // Remove existing listeners to prevent duplicates
        document.removeEventListener('click', handleShareButtonClick);
        
        // Store reference for cleanup
        window.dotNetRef = dotNetObjectRef;
        console.log('[DEBUG-WORKITEM:assetshare:continue] 💾 Stored DotNet reference to window.dotNetRef');
        
        // Check for existing share buttons
        const existingButtons = document.querySelectorAll('.ks-share-button');
        console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 Found existing share buttons:', {
            count: existingButtons.length,
            buttons: Array.from(existingButtons).map(btn => ({
                shareId: btn.getAttribute('data-share-id'),
                assetType: btn.getAttribute('data-asset-type'),
                innerHTML: btn.innerHTML.substring(0, 50)
            }))
        });
        
        // Add event listener for share button clicks using event delegation
        document.addEventListener('click', handleShareButtonClick);
        console.log('[DEBUG-WORKITEM:assetshare:continue] 👂 Added new click event listener');
        
        const handlerCompleteTime = new Date();
        const completeTimeString = handlerCompleteTime.toLocaleTimeString() + '.' + handlerCompleteTime.getMilliseconds().toString().padStart(3, '0');
        console.log('[ASSET-SHARE-TIMING] ✅ HANDLER SETUP COMPLETE:', completeTimeString);
        console.log('[ASSET-SHARE-TIMING] ⏱️ SETUP DURATION:', (handlerCompleteTime - handlerSetupTime) + 'ms');
        
        // Test click handler by simulating a click
        if (existingButtons.length > 0) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] 🧪 Testing click handler with first button...');
            // Don't actually click, just log that we could
            const firstButton = existingButtons[0];
            console.log('[DEBUG-WORKITEM:assetshare:continue] 🎯 First button details:', {
                tagName: firstButton.tagName,
                className: firstButton.className,
                attributes: Array.from(firstButton.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')
            });
        }
        
        console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Share button handlers setup completed successfully!');
    }
    
    function handleShareButtonClick(event) {
        // [DEBUG-WORKITEM:assetshare:continue] Enhanced click debugging - log ALL clicks first
        const clickData = {
            target: event.target,
            tagName: event.target.tagName,
            className: event.target.className,
            hasClosest: !!event.target.closest,
            allClasses: Array.from(event.target.classList || [])
        };
        
        console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 CLICK DETECTED:', clickData);
        
        // TOAST: Show click detection
        console.log('[SHARE-DEBUG] 🔍 CLICK DETECTED:', clickData);
        
        // Check if clicked element is a share button
        const shareButton = event.target.closest('.ks-share-button');
        
        const shareButtonCheck = {
            foundShareButton: !!shareButton,
            shareButtonElement: shareButton,
            shareButtonClasses: shareButton ? Array.from(shareButton.classList) : null
        };
        
        console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 SHARE BUTTON CHECK:', shareButtonCheck);
        
        // TOAST: Show share button detection result
        if (shareButton) {
            console.log('[SHARE-DEBUG] ✅ SHARE BUTTON FOUND:', shareButtonCheck);
        } else {
            console.log('[SHARE-DEBUG] ❌ Not a share button click:', shareButtonCheck);
        }
        
        if (!shareButton) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] ❌ Not a share button click, ignoring');
            return;
        }
        
        event.preventDefault();
        
        const shareId = shareButton.getAttribute('data-share-id');
        const assetType = shareButton.getAttribute('data-asset-type');
        const instanceNumber = parseInt(shareButton.getAttribute('data-instance-number')) || 1;
        
        const attributesData = {
            shareId,
            assetType,
            instanceNumber,
            allAttributes: Array.from(shareButton.attributes).map(attr => ({
                name: attr.name,
                value: attr.value
            }))
        };
        
        console.log('[DEBUG-WORKITEM:assetshare:continue] 🔍 SHARE BUTTON ATTRIBUTES:', attributesData);
        
        // TOAST: Show extracted attributes
        console.log('[SHARE-DEBUG] 📋 SHARE BUTTON ATTRIBUTES:', attributesData);
        
        if (!shareId || !assetType) {
            const errorData = { shareId, assetType, instanceNumber };
            console.error('[DEBUG-WORKITEM:assetshare:continue] ❌ Missing data attributes:', errorData);
            console.log('[SHARE-DEBUG] ❌ MISSING DATA ATTRIBUTES:', errorData);
            alert(`Missing data attributes: shareId=${shareId}, assetType=${assetType}`);
            return;
        }
        
        // Find and display the HTML payload that would be shared
        const assetElement = document.querySelector(`[data-asset-id="${shareId}"]`);
        if (assetElement) {
            const htmlPayload = {
                outerHTML: assetElement.outerHTML.substring(0, 500) + (assetElement.outerHTML.length > 500 ? '...' : ''),
                textContent: assetElement.textContent?.substring(0, 200) || '',
                className: assetElement.className || '',
                elementFound: true
            };
            console.log('[SHARE-DEBUG] 📦 HTML PAYLOAD TO BE SHARED:', htmlPayload);
        } else {
            console.log('[SHARE-DEBUG] ❌ ASSET ELEMENT NOT FOUND:', { shareId, selector: `[data-asset-id="${shareId}"]` });
        }
        
        console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ Share button clicked - processing:', { shareId, assetType, instanceNumber });
        
        // Disable button during processing
        const originalContent = shareButton.innerHTML;
        shareButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SHARING...';
        shareButton.disabled = true;
        shareButton.style.backgroundColor = '#f59e0b';
        
        console.log('[DEBUG-WORKITEM:assetshare:continue] 🔄 Calling DotNet method ShareAsset...');
        
        // [DOM-TIMING] Log click timing for DOM debugging
        const clickTime = new Date().toISOString();
        const clickTimestamp = Date.now();
        console.log('[DOM-TIMING] Share button clicked at', clickTime, 'timestamp:', clickTimestamp);
        console.log('[DOM-TIMING] About to invoke KSESSIONS ShareAsset method');
        
        // TOAST: Show method call initiation
        console.log('[SHARE-DEBUG] 🔄 CALLING C# METHOD...', { shareId, assetType, instanceNumber });
        
        // Call C# method via DotNet interop
        if (window.dotNetRef) {
            console.log('[DEBUG-WORKITEM:assetshare:continue] 📞 DotNet reference available, invoking ShareAsset...');
            
            // TOAST: Show DotNet reference status
            console.log('[SHARE-DEBUG] 📞 DOTNET REFERENCE FOUND:', { hasReference: true, method: 'ShareAsset' });
            
            window.dotNetRef.invokeMethodAsync('ShareAsset', shareId, assetType, instanceNumber)
                .then((result) => {
                    console.log('[DEBUG-WORKITEM:assetshare:continue] ✅ ShareAsset completed successfully:', result);
                    
                    // TOAST: Show success result
                    console.log('[SHARE-DEBUG] 🎉 SHARE SUCCESS:', result);
                    
                    // Success feedback
                    shareButton.innerHTML = '✅ SHARED!';
                    shareButton.style.backgroundColor = '#059669';
                    
                    // Restore button after 3 seconds
                    setTimeout(() => {
                        shareButton.innerHTML = originalContent;
                        shareButton.style.backgroundColor = '';
                        shareButton.disabled = false;
                    }, 3000);
                })
                .catch((error) => {
                    console.error('[DEBUG-WORKITEM:assetshare:continue] ❌ ShareAsset failed:', error);
                    
                    // TOAST: Show error details
                    console.log('[SHARE-DEBUG] 💥 SHARE FAILED:', { error: error.toString(), shareId, assetType });
                    
                    // Error feedback
                    shareButton.innerHTML = '❌ ERROR';
                    shareButton.style.backgroundColor = '#dc2626';
                    
                    // Restore button after error
                    setTimeout(() => {
                        shareButton.innerHTML = originalContent;
                        shareButton.style.backgroundColor = '';
                        shareButton.disabled = false;
                    }, 3000);
                });
        } else {
            console.error('[DEBUG-WORKITEM:assetshare:continue] ❌ DotNet reference not available');
            
            // TOAST: Show DotNet reference error
            console.log('[SHARE-DEBUG] ❌ NO DOTNET REFERENCE:', { hasReference: false, windowDotNetRef: !!window.dotNetRef });
            
            alert('DotNet reference not available. Please refresh the page.');
            shareButton.innerHTML = originalContent;
            shareButton.style.backgroundColor = '';
            shareButton.disabled = false;
        }
    }
    
    // Enhanced Custom Asset Detection Popup using SweetAlert2
    window.showCustomAssetPopup = function(htmlContent, title) {
        try {
            console.log('[DEBUG-WORKITEM:popup:start] Attempting to show custom asset popup');
            console.log('[DEBUG-WORKITEM:popup:content-length] HTML content length:', htmlContent ? htmlContent.length : 0);
            
            // Check if SweetAlert2 is available
            if (typeof Swal === 'undefined') {
                console.error('[DEBUG-WORKITEM:popup:error] SweetAlert2 not available, using fallback');
                throw new Error('SweetAlert2 not loaded');
            }
            
            // Use SweetAlert2 for reliable HTML rendering
            Swal.fire({
                title: title || '🔍 Asset Detection Results',
                html: htmlContent,
                width: '90%',
                maxWidth: '900px',
                showCloseButton: true,
                showConfirmButton: false,
                allowOutsideClick: true,
                allowEscapeKey: true,
                customClass: {
                    popup: 'noor-asset-popup',
                    title: 'noor-popup-title',
                    htmlContainer: 'noor-popup-content'
                },
                didOpen: () => {
                    console.log('[DEBUG-WORKITEM:popup:success] SweetAlert2 popup opened successfully');
                    // Add custom styling
                    const popup = Swal.getPopup();
                    if (popup) {
                        popup.style.borderRadius = '20px';
                        popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25)';
                        
                        // Style the title
                        const title = popup.querySelector('.swal2-title');
                        if (title) {
                            title.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)';
                            title.style.color = 'white';
                            title.style.padding = '20px 30px';
                            title.style.margin = '-20px -20px 20px -20px';
                            title.style.borderRadius = '20px 20px 0 0';
                            title.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }
                        
                        // Style the content area
                        const content = popup.querySelector('.swal2-html-container');
                        if (content) {
                            content.style.maxHeight = '70vh';
                            content.style.overflowY = 'auto';
                            content.style.padding = '20px';
                        }
                    }
                }
            });
            
            console.log('[DEBUG-WORKITEM:popup:complete] Custom asset popup displayed via SweetAlert2');
        } catch (error) {
            console.error('[DEBUG-WORKITEM:popup:error] Error in showCustomAssetPopup:', error);
            // Fallback to simple native popup if SweetAlert2 fails
            const simpleContent = htmlContent ? htmlContent.replace(/<[^>]*>/g, '') : 'Asset detection completed';
            alert(`${title || 'Asset Detection'}\n\n${simpleContent.substring(0, 500)}${simpleContent.length > 500 ? '...' : ''}`);
        }
    };
    
    // Note: CSS animations handled inline to avoid Razor parsing issues
    
    console.log('[DEBUG-WORKITEM:assetshare:continue] Share button JavaScript functions defined');
</script></div><!--!-->

<!--!--><style>
.nc-landing-container {
    min-height: 100vh;
    margin: 0;
    padding: 0;
}
</style><!--!-->

<!--!-->

    <!-- Toast Container for Notifications -->
    <!-- DEBUG-WORKITEM: Added toast container for session-transcript.css toast styling ;CLEANUP_OK -->
    <div id="toastContainer" class="toast-container"></div>

    <div id="blazor-error-ui">
        
        
            An unhandled exception has occurred. See browser dev tools for details.
        
        <a href="" class="reload">Reload</a>
        <a class="dismiss">🗙</a>
    </div>

    <script src="_framework/blazor.server.js"></script>
    <script src="js/noor-logging.js"></script>
    <script src="js/noor-annotations.js"></script>
    <script src="js/noor-share-system.js"></script>
    
    <!-- [DIAGNOSTIC:notyf:signalr] Q&A Toast Functions - Updated for Notyf ;CLEANUP_OK -->
    <script>
        // Q&A Toast Notification Functions using NoorToast wrapper
        window.showQuestionToast = function(questionData) {
            console.log('[DIAGNOSTIC:notyf:signalr] showQuestionToast called for question:', questionData.id, ';CLEANUP_OK');
            
            if (typeof window.NoorToast !== 'undefined') {
                const message = `"${questionData.text}" - ${questionData.userName || 'Anonymous'}`;
                window.NoorToast.show(message, 'New Question Received', 'info');
                console.log('[DIAGNOSTIC:notyf:signalr] ✅ Question toast displayed via NoorToast ;CLEANUP_OK');
            } else {
                console.error('[DIAGNOSTIC:notyf:signalr] ❌ NoorToast not available, using console fallback ;CLEANUP_OK');
                console.log('NOOR-QA: New question -', questionData.text);
            }
        };

        window.showVoteUpdateToast = function(questionId, newVoteCount) {
            console.log('[DIAGNOSTIC:notyf:signalr] showVoteUpdateToast called for question:', questionId, 'votes:', newVoteCount, ';CLEANUP_OK');
            
            if (typeof window.NoorToast !== 'undefined') {
                window.NoorToast.show(`Question received ${newVoteCount} votes`, 'Vote Update', 'success');
                console.log('[DIAGNOSTIC:notyf:signalr] ✅ Vote update toast displayed via NoorToast ;CLEANUP_OK');
            }
        };

        console.log('[DIAGNOSTIC:notyf:signalr] ✅ Q&A toast notification system initialized with Notyf ;CLEANUP_OK');
    </script>
    
    <script>
        // Initialize NOOR Canvas browser logging
        if (window.NoorLogger) {
            NoorLogger.info('NOOR-INIT', 'NOOR Canvas application loaded', {
                blazorMode: 'ServerPrerendered',
                environment: 'Development'
            });
            
            // Enhanced CSS Debug Logging (Issue: CSS padding changes not visible)
            window.addEventListener('DOMContentLoaded', function() {
                console.log('🎨 CSS DEBUG: Starting CSS verification...');
                
                // Check if noor-canvas.css loaded
                const noorCanvasLink = document.querySelector('link[href*="noor-canvas.css"]');
                if (noorCanvasLink) {
                    console.log('✅ CSS DEBUG: noor-canvas.css link found:', noorCanvasLink.href);
                    
                    // Test for .noor-btn class padding
                    setTimeout(function() {
                        const testBtn = document.querySelector('.noor-btn');
                        if (testBtn) {
                            const styles = window.getComputedStyle(testBtn);
                            console.log('🔍 CSS DEBUG: .noor-btn padding values:', {
                                paddingTop: styles.paddingTop,
                                paddingRight: styles.paddingRight,
                                paddingBottom: styles.paddingBottom,
                                paddingLeft: styles.paddingLeft,
                                padding: styles.padding
                            });
                        } else {
                            console.log('⚠️ CSS DEBUG: No .noor-btn elements found to test');
                        }
                    }, 500);
                } else {
                    console.error('❌ CSS DEBUG: noor-canvas.css link not found!');
                }
                
                // Log all loaded CSS files
                const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
                console.log('📋 CSS DEBUG: All loaded CSS files:');
                cssLinks.forEach((link, index) => {
                    console.log(`  ${index + 1}. ${link.href}`);
                });
            });
            
            // Blazor Server auto-starts, monitor the connection status
            // Note: Blazor.start() removed to prevent double initialization
            window.addEventListener('load', function() {
                // Wait for Blazor to auto-initialize, then log status
                setTimeout(function() {
                    if (window.Blazor) {
                        NoorLogger.info('BLAZOR-STARTUP', 'Blazor server connection auto-established');
                    } else {
                        NoorLogger.error('BLAZOR-STARTUP', 'Blazor auto-initialization failed');
                    }
                }, 1000);
            });
        }
    </script>


<div class="notyf" style="justify-content: flex-end; align-items: flex-end;"></div><div class="notyf-announcer" aria-atomic="true" aria-live="polite" style="border: 0px; clip: rect(0px, 0px, 0px, 0px); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; outline: 0px;">success: Clean Canvas completed successfully</div><div id="savvy-root" style="position: relative; z-index: 2147483647; display: block;"><template shadowrootmode="open"><link rel="stylesheet" href="chrome-extension://jmogjacildaeibcnaadplhciblohkiff/content.css"></template></div></body><grammarly-desktop-integration data-grammarly-shadow-root="true"><template shadowrootmode="open"><style>
      div.grammarly-desktop-integration {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select:none;
        user-select:none;
      }

      div.grammarly-desktop-integration:before {
        content: attr(data-content);
      }
    </style><div aria-label="grammarly-integration" role="group" tabindex="-1" class="grammarly-desktop-integration" data-content="{&quot;mode&quot;:&quot;limited&quot;,&quot;isActive&quot;:false,&quot;isUserDisabled&quot;:false}"></div></template></grammarly-desktop-integration></html>