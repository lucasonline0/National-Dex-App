// DOM Elements
let grid, searchInput, generationFilter, typeFilter, loadMoreBtn, loadingIndicator, modal, toolsModal, toolsMenuBtn, toolsContent;

// State & Config
let allPokemon = [];
let allPokemonNames = [];
let offset = 0;
const limit = 50;
const apiCache = new Map();

// Tool-specific state
let currentTeam = [];
let comparatorPokemon = [null, null];
let allAbilities = [];
let coverageTeam = [];

document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements
    grid = document.getElementById('pokedex-grid');
    searchInput = document.getElementById('search-input');
    generationFilter = document.getElementById('generation-filter');
    typeFilter = document.getElementById('type-filter');
    loadMoreBtn = document.getElementById('load-more-btn');
    loadingIndicator = document.getElementById('loading-indicator');
    modal = document.getElementById('pokemon-modal');
    toolsModal = document.getElementById('tools-modal');
    toolsMenuBtn = document.getElementById('tools-menu-btn');
    toolsContent = document.getElementById('tools-content');

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async function init() {
        searchInput.addEventListener('input', debounce(applyFilters, 400));
        typeFilter.addEventListener('change', applyFilters);
        generationFilter.addEventListener('change', handleGenerationChange);
        loadMoreBtn.addEventListener('click', loadPokemon);

        const toolsDropdown = document.getElementById('tools-dropdown');
        toolsMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toolsDropdown.classList.toggle('hidden');
            if (!toolsDropdown.classList.contains('hidden')) {
                feather.replace();
            }
        });

        document.querySelectorAll('.tool-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const toolName = item.dataset.tool;
                toolsDropdown.classList.add('hidden');
                openToolsModal(toolName);
            });
        });

        document.addEventListener('click', (event) => {
            if (toolsDropdown && !toolsDropdown.classList.contains('hidden') && !toolsDropdown.contains(event.target) && !toolsMenuBtn.contains(event.target)) {
                toolsDropdown.classList.add('hidden');
            }
        });
        
        toolsModal.querySelector('.modal-backdrop').addEventListener('click', () => toolsModal.classList.add('hidden'));
        document.getElementById('close-tools-modal-btn').addEventListener('click', () => toolsModal.classList.add('hidden'));

        
        feather.replace();
        setupMouseGlow();
        await populateFilters();
        await populateGenerationFilter();
        await loadAllPokemonNames();
        await loadPokemon();
        updateTrainerInfoDisplay();
    }

    init();
});
