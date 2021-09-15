/**
 * # full-auto-cookie-clicker.js
 * v1.5
 * 全自動 Cookie Clicker (v2.031対応)
 * 
 * ## 基本方針
 * 全施設と一部のアップグレードについて
 * (購入費用) * (1 + (現在の基礎CpS) / (購入によるCpS上昇))
 * が最小の要素を購入する
 * 
 * ## 平行要素
 * - 自動クリック(実測 150~200回/s)
 * - Golden Cookieは常時監視して瞬時に潰す
 * - 全てのwrinklerを瞬時に潰す
 * - 上記以外のアップグレードは購入可能時に逐次購入する
 *   - 基本方針に割り込みが発生し、購入順序が変わる可能性がある
 * - Heavenly ChipをTARGET_HC枚稼ぐ毎にAscendする
 *   - Prestigeは可能な限り購入する
 *   - 7秒後にReincarnate
 * - BACKUP_INTERVAL毎にセーブをダウンロードさせる
 * 
 * ## 参考
 * [Cookie Clicker](URL: https://orteil.dashnet.org/cookieclicker/)
 * [cookie clicker 日本語wiki](https://w.atwiki.jp/cookieclickerjpn/)
 * [Cookie Clicker で効率的に True Neverclick を取得する方法](https://inuwara-note.hateblo.jp/entry/cookie-clicker-2)
 * [【クッキー】CookieClicker【ババア】 9枚目](https://uni.5ch.net/test/read.cgi/gameswf/1380563429/275?v=pc)
 * 
 * ## 既知の問題点
 * - オブジェクト毎の現在のCpSを取得する手順が確立していない
 *   - cps(), baseCps, storedCpsは同じ値を返し、storedTotalCpsはこれらにamountをかけた値を返すが、いずれも現在のCpSとは異なる？
 */

(function(){
    "use strict";

    /** setIntervalのtimeoutに指定できる最短(ms) */
    const MINIMUM_TIMEOUT = 4;
    /** Ascendするまでに稼ぐHeavenlyChip数 */
    const TARGET_HC = 500;
    /** 進行状況をバックアップする間隔(ms) */
    const BACKUP_INTERVAL = 60 * 60 * 1000;

    /**
     * 効果を加味して購入するアップグレード一覧
     * 
     * 変更する場合 getAmountOfRise() を確認すること
     */
    const UPGRADE_NAME = [
        [ 'Reinforced index finger', 'Carpal tunnel prevention cream', 'Ambidextrous', 'Thousand fingers', 'Million fingers', 'Billion fingers', 'Trillion fingers', 'Quadrillion fingers', 'Quintillion fingers', 'Sextillion fingers', 'Septillion fingers', 'Octillion fingers', 'Nonillion fingers' ],
        [ 'Forwards from grandma', 'Steel-plated rolling pins','Lubricated dentures','Prune juice', 'Double-thick glasses', 'Aging Agents', 'Xtreme walkers', 'The Unbridling', 'Reverse dementia', 'Timeproof hair dyes', 'Good manners', 'Generation degeneration', 'Visits' ],
        [ 'Cheap hoes','Fertilizer', 'Cookie trees', 'Genetically-modified cookies', 'Gingerbread scareclows', 'Pulsar sprinklers', 'Fudge fungus', 'Wheat triffids', 'Humane pesticides', 'Barnstars', 'Lindworms', 'Global seed vault', 'Reverse-veganism' ],
        [ 'Sugar gas', 'Megadrill','Ultradrill', 'Ultimadrill', 'H-bomb mining', 'Core forge', 'Planetsplitters', 'Canola oil wells', 'Mole people', 'Mine canaries', 'Bore again', 'Air mining', 'Caramel alloys' ],
        [ 'Sturdier conveyor belts', 'Child labor','Sweatshop','Radium reactors', 'Recombobulators', 'Deep-bake process', 'Cyborg workforce', '78-hour days', 'Machine learning', 'Brownie point system', '"Volunteer" interns', 'Behavioral reframing', 'The infinity engine' ],
        [ 'Taller tellers','Scissor-resistant credit cards', 'Acid-proof vaults','Chocolate coins', 'Exponential interest rates', 'Financial zen', 'Way of the wallet', 'The stuff rationale', 'Edible money', 'Grand supercycles', 'Rules of acquisition', 'Altruistic loop', 'Diminishing tax returns' ],
        [ 'Golden idols','Sacrifices', 'Delicious blessing', 'Sun festival', 'Enlarged pantheon', 'Great Baker in the sky', 'Creation myth', 'Theocracy', 'Sick rap prayers', 'Psalm-reading', 'War of the gods', 'A novel idea', 'Apparitions' ],
        [ 'Pointier hats', 'Beardlier beards', 'Ancient grimoires','Kitchen curses', 'School of sorcery', 'Dark formulas', 'Cookiemancy', 'Rabbit trick', 'Deluxe tailored wands', 'Immobile spellcasting', 'Electricity', 'Spelling bees', 'Wizard basements' ],
        [ 'Vanilla nebulae', 'Wormholes','Frequent flyer', 'Warp drive', 'Chocolate monoliths', 'Generation ship', 'Dyson sphere', 'The final frontier', 'Autopilot', 'Restaurants at the end of the universe', 'Universal alphabet', 'Toroid universe', 'Prime directive' ],
        [ 'Antimony','Essence of dough', 'True chocolate', 'Ambrosia', 'Aqua crustulae', 'Origin crucible', 'Theory of atomic fluidity', 'Beige goo', 'The advent of chemistry', 'On second thought', 'Public betterment', 'Hermetic reconciliation', 'Chromatic cycling' ],
        [ 'Ancient tablet','Insane oatling workers', 'Soul bond','Sanity dance', 'Brane transplant', 'Deity-sized portals', 'End of times back-up plan', 'Maddening chants', 'The real world', 'Dimensional garbage gulper', 'Embedded microportals', 'His advent', 'Domestic rifts' ],
        [ 'Flux capacitors', 'Time paradox resolver','Quantum conundrum','Causality enforcer', 'Yestermorrow comparators', 'Far future enactment', 'Great loop hypothesis', 'Cookietopian moments of maybe', 'Second seconds', 'Additional clock hands', 'Nostalgia', 'Split seconds', 'Patience abolished' ],
        [ 'Sugar bosons','String theory','Large macaron collider', 'Big bang bake', 'Reverse cyclotrons', 'Nanocosmics', 'The Pulse', 'Some other super-tiny fundamental particle? Probably?', 'Quantum comb', 'Baking Nobel prize', 'The definite molecule', 'Flavor itself', 'Delicious pull' ],
        [ 'Gem polish','9th color','Chocolate light', 'Grainbow', 'Pure cosmic light', 'Glow-in-the-dark', 'Lux sanctorum', 'Reverse shadows', 'Crystal mirrors', 'Reverse theory of light', 'Light capture measures', 'Light speed limit', 'Occam\'s laser' ],
        [ 'Your lucky cookie', '"All Bets Are Off" magic coin','Winning lottery ticket', 'Four-leaf clover field', 'A recipe book about books', 'Leprechaun village', 'Improbability drive', 'Antisuperstistronics', 'Bunnypedes', 'Revised probabilistics', '0-sided dice', 'A touch of determinism', 'On a streak' ],
        [ 'Metabakeries','Mandelbrown sugar','Fractoids', 'Nested universe theory', 'Menger sponge cake', 'One particularly good-humored cow', 'Chocolate ouroboros', 'Nested', 'Space-filling fibers', 'Endless book of prose', 'The set of all sets', 'This upgrade', 'A box' ],
        [ 'The JavaScript console for dummies', '64bit arrays','Stack overflow', 'Enterprise compiler', 'Syntactic sugar', 'A nice cup of coffee', 'Just-in-time baking', 'cookies++', 'Software updates', 'Game.Loop', 'eval()', 'Your biggest fans', 'Hacker shades' ],
        [ 'Manifest destiny','The multiverse in a nutshell', 'All-conversion', 'Multiverse agents', 'Escape plan', 'Game design', 'Sandbox universes', 'Multiverse wars', 'Mobile ports', 'Encapsulated realities', 'Extrinsic clicking', 'Universal idling', 'Break the fifth wall' ],
        [ 'Cookie crumbs', 'Chocolate chip cookie', 'Plain cookies', 'Sugar cookies', 'Oatmeal raisin cookies', 'Peanut butter cookies', 'Coconut cookies', 'Almond cookies', 'Hazelnut cookies', 'Walnut cookies', 'Cashew cookies', 'White chocolate cookies', 'Milk chocolate cookies', 'Macadamia nut cookies', 'Double-chip cookies', 'White chocolate macadamia nut cookies', 'All-chocolate cookies', 'Dark chocolate-coated cookies', 'White chocolate-coated cookies', 'Eclipse cookies', 'Zebra cookies', 'Snickerdoodles', 'Stroopwafels', 'Macaroons', 'Empire biscuits', 'Madeleines', 'Palmiers', 'Palets', 'Sables', 'Caramoas', 'Sagalongs', 'Shortfoils', 'Win mints', 'Gingerbread men', 'Gingerbread trees', 'Pure black chocolate cookies', 'Pure white chocolate cookies', 'Ladyfingers', 'Tuiles', 'Chocolate-stuffed biscuits', 'Checker cookies', 'Butter cookies', 'Cream cookies', 'Gingersnaps', 'Cinnamon cookies', 'Vanity cookies', 'Cigars', 'Pinwheel cookies', 'Fudge squares', 'Shortbread bisquit', 'Millionaire\'s shortbreads', 'Caramel cookies', 'Pecan sandies', 'Moravian spice cookies', 'Anzac biscuits', 'Buttercakes', 'Ice cream sandwiches', 'Pink biscuits', 'Whole-grain cookies', 'Candy cookies', 'Big chip cookies', 'One chip cookies', 'Sprinkles cookies', 'Peanut butter blossoms', 'No-bake cookies', 'Florentines', 'Chocolate crinkles', 'Maple cookies', 'Persian rice cookies', 'Norwegian cookies', 'Crispy rice cookies', 'Ube cookies', 'Butterscotch cookies', 'Speculaas', 'Chocolate oatmeal cookies', 'Molasses cookies', 'Biscotti', 'Waffle cookies', 'Custard creams', 'Bourbon biscuits', 'Mini-cookies', 'Whoopie pies', 'Caramel wafer biscuits', 'Chocolate chip mocha cookies', 'Earl Grey cookies', 'Chai tea cokkies', 'Corn syrup cookies', 'Icebox cookies', 'Graham crackers', 'Hardtack', 'Cornflake cookies', 'Tofu cookies', 'Gluten-free cookies', 'Russian bread cookies', 'Lebkuchen', 'Aachener Printen', 'Canistrelli', 'Nice biscuits', 'French pure butter cookies', 'Petit beurre', 'Nanaimo bars', 'Berger cookies', 'Chinsuko', 'Panda koala biscuits', 'Putri salju', 'Milk cookies', 'Kruidnoten', 'Marie biscuits', 'Meringue cookies', 'Yogurt cookies', 'Thumbprint cookies', 'Pizzelle', 'Granola cookies', 'Ricotta cookies', 'Roze koeken', 'Peanut butter cup cookies', 'Sesame cookies', 'Taiyaki', 'Vanillekipferl', 'Bettenberg biscuits', 'Rosette cookies', 'Gangmakers', 'Welsh cookies', 'Raspberry cheesecake cookies', 'Bokkenpootjes', 'Fat rascals', 'Ischler cookies', 'Matcha cookies', 'Butter horseshoes', 'Butter pucks', 'Butter knots', 'Butter slabs', 'Butter swirls', 'Fig gluttons', 'Loreols', 'Jaffa cakes', 'Grease\'s cups', 'Digits', 'Lombardia cookies', 'Bastenaken cookies', 'Festivity loops', 'Havabreaks', 'Zilla wafers', 'Dim Dams', 'Pokey', 'British tea biscuits', 'Chocolate british tea biscuits', 'Round british tea biscuits', 'Round chocolate british tea biscuits', 'Round british tea biscuits with heart motif', 'Round chocolate british tea biscuits with heart motif', 'Rose macarons', 'Lemon macarons', 'Chocolate macarons', 'Pistachio macarons', 'Hazelnut macarons', 'Violet macarons', 'Caramel macarons', 'Licorice macarons', 'Earl Grey macarons', 'Profiteroles', 'Jelly donut', 'Glazed donut', 'Chocolate cake', 'Strawberry cake', 'Apple pie', 'Lemon meringue pie', 'Butter croissant', 'Cookie dough', 'Burnt cookie', 'A chocolate chip cookie but with the chips picked off for some reason', 'Flavor text cookie', 'High-definition cookie', 'Crackers', 'Toast', 'Peanut butter & jelly', 'Wookies', 'Cheeseburger', 'One lone chocolate chip', 'Pizza', 'Candy', 'Skull cookies', 'Ghost cookies', 'Bat cookies', 'Slime cookies', 'Pumpkin cookies', 'Eyeball cookies', 'Spider cookies', 'Christmas tree biscuits', 'Snowflake biscuits', 'Snowman biscuits', 'Holly biscuits', 'Candy cane biscuits', 'Bell biscuits', 'Present biscuits', 'Pure heart biscuits', 'Ardent heart biscuits', 'Sour heart biscuits', 'Weeping heart biscuits', 'Golden heart biscuits', 'Eternal heart biscuits', 'Prism heart biscuits', 'Elderwort buiscuit', 'Bakeberry cookies', 'Duketater cookies', 'Wheat slims', 'Dragon cookie', 'Milk chocolate butter biscuit', 'Dark chocolate butter biscuit', 'White chocolate butter biscuit', 'Ruby chocolate butter biscuit', 'Lavender chocolate butter biscuit', 'Synthetic chocolate green honey butter biscuit', 'Royal raspberry chocolate butter biscuit', 'Ultra-concentrated high-energy chocolate butter biscuit', 'Pure pitch-black chocolate butter biscuit', 'Cosmic chocolate butter biscuit', 'Butter biscuit (with butter)' ],
        [ '', '', 'Farmer grandmas', 'Miner grandmas', 'Worker grandmas', 'Banker grandmas', 'Priestess grandmas', 'Witch grandmas', 'Cosmic grandmas', 'Transmuted grandmas', 'Altered grandmas', 'Grandmas\' grandmas', 'Antigrandmas', 'Rainbow grandmas', 'Lucky grandmas', 'Metagrandmas', 'Binary grandmas', 'Alternate grandmas' ],
        [ 'Kitten helpers', 'Kitten workers', 'Kitten engineers', 'Kitten overseers', 'Kitten managers', 'Kitten accountants', 'Kitten specialists', 'Kitten experts', 'Kitten consultants', 'Kitten assistants to the regional manager', 'Kitten marketeers', 'Kitten analysts', 'Kitten executives', 'Kitten angels', 'Fortune #103' ],
        [ 'Bingo center/Research facility', 'Specialized chocolate chips', 'Designer cocoa beans', 'Ritual rolling pins', 'Underworld ovens', 'One mind', 'Exotic nuts', 'Communal brainsweep', 'Arcane sugar', 'Elder Pact' ]
    ];

    /**
     * UPGRADE_NAME における行位置
     * 
     * 施設についてはIDを兼ねる
     */
    const KEY = {
        "CURSOR": 0,
        "GRANDMA": 1,
        "PORTAL": 10,
        "FLAVORED_COOKIES": 18,
        "SYNERGY_GRANDMA": 19,
        "KITTEN": 20,
        "GRANDMAPOCALYPSE": 21
    };

    /** Flavored Cookies によってCpSにかかる効果 */
    const EFFECT_FLAVORED_COOKIES = {
        "Cookie crumbs": 0.01,
        "Chocolate chip cookie": 0.1,
        "Plain cookies": 0.01,
        "Sugar cookies": 0.01,
        "Oatmeal raisin cookies": 0.01,
        "Peanut butter cookies": 0.01,
        "Coconut cookies": 0.02,
        "Almond cookies": 0.02,
        "Hazelnut cookies": 0.02,
        "Walnut cookies": 0.02,
        "Cashew cookies": 0.02,
        "White chocolate cookies": 0.02,
        "Milk chocolate cookies": 0.02,
        "Macadamia nut cookies": 0.02,
        "Double-chip cookies": 0.02,
        "White chocolate macadamia nut cookies": 0.02,
        "All-chocolate cookies": 0.02,
        "Dark chocolate-coated cookies": 0.04,
        "White chocolate-coated cookies": 0.04,
        "Eclipse cookies": 0.02,
        "Zebra cookies": 0.02,
        "Snickerdoodles": 0.02,
        "Stroopwafels": 0.02,
        "Macaroons": 0.02,
        "Empire biscuits": 0.02,
        "Madeleines": 0.02,
        "Palmiers": 0.02,
        "Palets": 0.02,
        "Sables": 0.02,
        "Caramoas": 0.03,
        "Sagalongs": 0.03,
        "Shortfoils": 0.03,
        "Win mints": 0.03,
        "Gingerbread men": 0.02,
        "Gingerbread trees": 0.02,
        "Pure black chocolate cookies": 0.04,
        "Pure white chocolate cookies": 0.04,
        "Ladyfingers": 0.03,
        "Tuiles": 0.03,
        "Chocolate-stuffed biscuits": 0.03,
        "Checker cookies": 0.03,
        "Butter cookies": 0.03,
        "Cream cookies": 0.03,
        "Gingersnaps": 0.04,
        "Cinnamon cookies": 0.04,
        "Vanity cookies": 0.04,
        "Cigars": 0.04,
        "Pinwheel cookies": 0.04,
        "Fudge squares": 0.04,
        "Shortbread bisquit": 0.04,
        "Millionaire's shortbreads": 0.04,
        "Caramel cookies": 0.04,
        "Pecan sandies": 0.04,
        "Moravian spice cookies": 0.04,
        "Anzac biscuits": 0.04,
        "Buttercakes": 0.04,
        "Ice cream sandwiches": 0.04,
        "Pink biscuits": 0.04,
        "Whole-grain cookies": 0.04,
        "Candy cookies": 0.04,
        "Big chip cookies": 0.04,
        "One chip cookies": 0.01,
        "Sprinkles cookies": 0.04,
        "Peanut butter blossoms": 0.04,
        "No-bake cookies": 0.04,
        "Florentines": 0.04,
        "Chocolate crinkles": 0.04,
        "Maple cookies": 0.04,
        "Persian rice cookies": 0.04,
        "Norwegian cookies": 0.04,
        "Crispy rice cookies": 0.04,
        "Ube cookies": 0.04,
        "Butterscotch cookies": 0.04,
        "Speculaas": 0.04,
        "Chocolate oatmeal cookies": 0.04,
        "Molasses cookies": 0.04,
        "Biscotti": 0.04,
        "Waffle cookies": 0.04,
        "Custard creams": 0.04,
        "Bourbon biscuits": 0.04,
        "Mini-cookies": 0.05,
        "Whoopie pies": 0.05,
        "Caramel wafer biscuits": 0.05,
        "Chocolate chip mocha cookies": 0.05,
        "Earl Grey cookies": 0.05,
        "Chai tea cokkies": 0.05,
        "Corn syrup cookies": 0.05,
        "Icebox cookies": 0.05,
        "Graham crackers": 0.05,
        "Hardtack": 0.05,
        "Cornflake cookies": 0.05,
        "Tofu cookies": 0.05,
        "Gluten-free cookies": 0.05,
        "Russian bread cookies": 0.05,
        "Lebkuchen": 0.05,
        "Aachener Printen": 0.05,
        "Canistrelli": 0.05,
        "Nice biscuits": 0.05,
        "French pure butter cookies": 0.05,
        "Petit beurre": 0.05,
        "Nanaimo bars": 0.05,
        "Berger cookies": 0.05,
        "Chinsuko": 0.05,
        "Panda koala biscuits": 0.05,
        "Putri salju": 0.05,
        "Milk cookies": 0.05,
        "Kruidnoten": 0.05,
        "Marie biscuits": 0.05,
        "Meringue cookies": 0.05,
        "Yogurt cookies": 0.05,
        "Thumbprint cookies": 0.05,
        "Pizzelle": 0.05,
        "Granola cookies": 0.05,
        "Ricotta cookies": 0.05,
        "Roze koeken": 0.05,
        "Peanut butter cup cookies": 0.05,
        "Sesame cookies": 0.05,
        "Taiyaki": 0.05,
        "Vanillekipferl": 0.05,
        "Bettenberg biscuits": 0.05,
        "Rosette cookies": 0.05,
        "Gangmakers": 0.05,
        "Welsh cookies": 0.05,
        "Raspberry cheesecake cookies": 0.05,
        "Bokkenpootjes": 0.05,
        "Fat rascals": 0.05,
        "Ischler cookies": 0.05,
        "Matcha cookies": 0.05,
        "Butter horseshoes": 0.04,
        "Butter pucks": 0.04,
        "Butter knots": 0.04,
        "Butter slabs": 0.04,
        "Butter swirls": 0.04,
        "Fig gluttons": 0.02,
        "Loreols": 0.02,
        "Jaffa cakes": 0.02,
        "Grease's cups": 0.02,
        "Digits": 0.02,
        "Lombardia cookies": 0.03,
        "Bastenaken cookies": 0.03,
        "Festivity loops": 0.02,
        "Havabreaks": 0.02,
        "Zilla wafers": 0.02,
        "Dim Dams": 0.02,
        "Pokey": 0.02,
        "British tea biscuits": 0.02,
        "Chocolate british tea biscuits": 0.02,
        "Round british tea biscuits": 0.02,
        "Round chocolate british tea biscuits": 0.02,
        "Round british tea biscuits with heart motif": 0.02,
        "Round chocolate british tea biscuits with heart motif": 0.02,
        "Rose macarons": 0.03,
        "Lemon macarons": 0.03,
        "Chocolate macarons": 0.03,
        "Pistachio macarons": 0.03,
        "Hazelnut macarons": 0.03,
        "Violet macarons": 0.03,
        "Caramel macarons": 0.03,
        "Licorice macarons": 0.03,
        "Earl Grey macarons": 0.03,
        "Profiteroles": 0.04,
        "Jelly donut": 0.04,
        "Glazed donut": 0.04,
        "Chocolate cake": 0.04,
        "Strawberry cake": 0.04,
        "Apple pie": 0.04,
        "Lemon meringue pie": 0.04,
        "Butter croissant": 0.04,
        "Cookie dough": 0.04,
        "Burnt cookie": 0.04,
        "A chocolate chip cookie but with the chips picked off for some reason": 0.03,
        "Flavor text cookie": 0.04,
        "High-definition cookie": 0.05,
        "Crackers": 0.05,
        "Toast": 0.04,
        "Peanut butter & jelly": 0.04,
        "Wookies": 0.04,
        "Cheeseburger": 0.04,
        "One lone chocolate chip": 0.01,
        "Pizza": 0.05,
        "Candy": 0.05,
        "Skull cookies": 0.02,
        "Ghost cookies": 0.02,
        "Bat cookies": 0.02,
        "Slime cookies": 0.02,
        "Pumpkin cookies": 0.02,
        "Eyeball cookies": 0.02,
        "Spider cookies": 0.02,
        "Christmas tree biscuits": 0.02,
        "Snowflake biscuits": 0.02,
        "Snowman biscuits": 0.02,
        "Holly biscuits": 0.02,
        "Candy cane biscuits": 0.02,
        "Bell biscuits": 0.02,
        "Present biscuits": 0.02,
        "Pure heart biscuits": 0.02,
        "Ardent heart biscuits": 0.02,
        "Sour heart biscuits": 0.02,
        "Weeping heart biscuits": 0.02,
        "Golden heart biscuits": 0.02,
        "Eternal heart biscuits": 0.02,
        "Prism heart biscuits": 0.02,
        "Elderwort buiscuit": 0.02,
        "Bakeberry cookies": 0.02,
        "Duketater cookies": 0.1,
        "Wheat slims": 0.01,
        "Dragon cookie": 0.05,
        "Milk chocolate butter biscuit": 0.1,
        "Dark chocolate butter biscuit": 0.1,
        "White chocolate butter biscuit": 0.1,
        "Ruby chocolate butter biscuit": 0.1,
        "Lavender chocolate butter biscuit": 0.1,
        "Synthetic chocolate green honey butter biscuit": 0.1,
        "Royal raspberry chocolate butter biscuit": 0.1,
        "Ultra-concentrated high-energy chocolate butter biscuit": 0.1,
        "Pure pitch-black chocolate butter biscuit": 0.1,
        "Cosmic chocolate butter biscuit": 0.1,
        "Butter biscuit (with butter)": 0.1
    };
    /** Kitten によってCpSにかかる効果 */
    const EFFECT_KITTEN = {
        "Kitten helpers": 0.1,
        "Kitten workers": 0.125,
        "Kitten engineers": 0.15,
        "Kitten overseers": 0.175,
        "Kitten managers": 0.2,
        "Kitten accountants": 0.2,
        "Kitten specialists": 0.2,
        "Kitten experts": 0.2,
        "Kitten consultants": 0.2,
        "Kitten assistants to the regional manager": 0.175,
        "Kitten marketeers": 0.15,
        "Kitten analysts": 0.125,
        "Kitten executives": 0.115,
        "Kitten angels": 0.1,
        "Fortune #103": 0.05
    };

    /** ババアポ解除関連アイテムを無効化 */
    const UPGRADE_TO_BYPASS = [ 'Elder Pledge', 'Sacrificial rolling pins', 'Elder Covenant', 'Revoke Elder Covenant' ];

    /** 周回毎に初期HC枚数を記録し、増加分で転生させる */
    let start_hc = Game.ascendMeterLevel;

    /** 自動クリック */
    setInterval(function() {Game.ClickCookie();}, MINIMUM_TIMEOUT);

    /** ログ表示量を減らす */
    let log = {
        "alreadySent": false,
        "nextTarget": ""
    };

    /**
     * 効率を計算して最適な施設を購入する
     * (購入費用) * (1 + (現在の基礎CpS) / (購入によるCpS上昇))
     * が最小の施設
     */
    setInterval(function() {
        // 施設
        let building_efficiency = [];
        for (let i = 0; i < Game.ObjectsById.length; i++) {
            building_efficiency.push(Game.ObjectsById[i].getPrice() * (1 + Game.cookiesPsRaw / Game.ObjectsById[i].storedCps));
        }
        
        // アップグレード
        let upgrade_efficiency = [];
        for (let i = 0; i < Game.UpgradesById.length; i++){
            let oUpgrades = Game.UpgradesById[i];

            if (oUpgrades.unlocked && isUpgrade(oUpgrades) && oUpgrades.bought == 0) {
                upgrade_efficiency.push(oUpgrades.getPrice() * (1 + Game.cookiesPsRaw / getAmountOfRise(oUpgrades)));
            } else {
                // 効果を加味しないで購入できるIDはInfinityで埋めて、判定から除外する
                upgrade_efficiency.push(Infinity);
            }
        }

        // efficiency配列のうちで最も小さいもの同士を比較する
        let min_b = getMinimumIndexOf(building_efficiency);
        let min_u = getMinimumIndexOf(upgrade_efficiency);
        let obj = Game.ObjectsById[min_b];
        let upg = Game.UpgradesById[min_u];

        let toBuy = building_efficiency[min_b] < upgrade_efficiency[min_u] ? obj : upg;

        // 次に購入するアイテムをログに出力
        // 割り込みによって変更される場合があるので名前も確認
        if (!log.alreadySent || log.nextTarget != toBuy.name) {
            console.log(toBuy.name);

            log.alreadySent = true;
            log.nextTarget = toBuy.name;
        }

        if (toBuy.getPrice() <= Game.cookies) {
            // 購入前の所持数
            let bought = toBuy.amount;

            try {
                toBuy.buy(1);
            } catch (e) {
                toBuy.buy();
            }

            // 購入数の変位で購入が完了したか確認
            if (toBuy.amount > bought) {
                log.alreadySent = false;
                log.nextTarget = "";
            }
        }

        /**
         * 配列の中で最小の値が格納されたindexを返す
         * @param {Array<Number>} arr 
         * @returns {Number} index
         */
        function getMinimumIndexOf(arr) {
            let min = Infinity;
            let min_i = 0;
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] < min) {
                    min = arr[i];
                    min_i = i;
                }
            }
            return min_i;
        }
        /**
         * アップグレード購入によるCpS上昇量を計算する
         * @param {Object} obj Game.Upgrades[n]
         * @returns {Number} 購入によるCpS上昇量
         */
        function getAmountOfRise(obj) {

            // 名前を検索して、何の施設の何番目のアップグレードなのか調査する
            let building = NaN;
            let count = NaN;
            for (let i = 0; i < UPGRADE_NAME.length; i++) {
                for (let j = 0; j < UPGRADE_NAME[i].length; j++) {
                    if (obj.name == UPGRADE_NAME[i][j]) {
                        building = i;
                        count = j;
                    }
                }
            }
            if (isNaN(building) || isNaN(count)) return Infinity;

            switch (building) {

                /**
                 * Cursor
                 */
                case KEY.CURSOR:
                {
                    let oCursor = Game.ObjectsById[KEY.CURSOR];

                    if (count < 3) {
                        // 2倍になる=上昇量は元のCpSに等しい
                        return oCursor.storedCps * oCursor.amount;

                    } else {

                        /** 他の施設の数 */
                        let other_amount = 0;
                        for (let i = 0; i < Game.ObjectsById.length; i++) if (Game.ObjectsById[i].name != "Cursor") other_amount += Game.ObjectsById[i].amount;
                        
                        switch(count) {
                            case 3:
                                return other_amount * 0.1;
                            case 4:
                                return other_amount * ((0.1 * 5) - 0.1);
                            case 5:
                                return other_amount * ((0.1 * 5 * 10) - (0.1 * 5));
                            default:
                                return other_amount * ((0.1 * 5 * 10 * Math.pow(20, count - 6)) - (0.1 * 5 * 10 * Math.pow(20, count - 7)));
                        }
                    }
                }
                /**
                 * Flavored Cookies
                 */
                case KEY.FLAVORED_COOKIES:
                    return Game.cookiesPsRaw * (EFFECT_FLAVORED_COOKIES[obj.name]);
    
                /**
                 * Kitten
                 */
                case KEY.KITTEN:
                    return Game.cookiesPsRaw * ((1 + Game.milkProgress * EFFECT_KITTEN[obj.name]) - 1);
    
                /**
                 * Synergy Grandmas
                 * (Grandma 2倍) + (シナジー効果)
                 */
                case KEY.SYNERGY_GRANDMA:
                {
                    let oGrandma = Game.ObjectsById[KEY.GRANDMA];
                    /** シナジー対象は count で保有している */
                    let oSynergy = Game.ObjectsById[count];
    
                    let increase_from_grandmas = oGrandma.storedCps * oGrandma.amount;
                    let increase_from_synergy = (oSynergy.storedCps * oSynergy.amount) * (oGrandma.amount / (count - 1) / 100);
    
                    return increase_from_grandmas + increase_from_synergy;
                }
                /**
                 * ババアポ関連アイテムの効果について
                 * https://w.atwiki.jp/cookieclickerjpn/pages/8.html
                 */
                case KEY.GRANDMAPOCALYPSE:
                {
                    let oGrandma = Game.ObjectsById[KEY.GRANDMA];
                    switch (count) {
                        case 0:
                            return oGrandma.storedCps * oGrandma.amount * 3;
                        case 1:
                            return Game.cookiesPsRaw * 0.01;
                        case 2:
                            return Game.cookiesPsRaw * 0.02;
                        case 3:
                            return oGrandma.storedCps * oGrandma.amount;
                        case 4:
                            return Game.cookiesPsRaw * 0.03;
                        case 5:
                            return 0.02 * oGrandma.amount;
                        case 6:
                            return Game.cookiesPsRaw * 0.04;
                        case 7:
                            return 0.02 * oGrandma.amount;
                        case 8:
                            return Game.cookiesPsRaw * 0.05;
                        case 9:
                            return 0.05 * Game.ObjectsById[KEY.PORTAL].amount;
                        default:
                            return Infinity;
                    }
                }
                /**
                 * Cursor以外
                 * 上昇量は現在のCpSに等しい
                 */
                default:
                    return Game.ObjectsById[building].storedCps * Game.ObjectsById[building].amount;
                
            }
        }
    }, MINIMUM_TIMEOUT);

    /** Golden Cookie 潰し */
    setInterval(function() {for (let i in Game.shimmers) {Game.shimmers[i].pop();}}, MINIMUM_TIMEOUT);

    /** 虫潰し */
    setInterval(function() {Game.wrinklers.forEach(function(me) { if (me.close == 1) me.hp = 0});}, 500);

    /** ストアに並んだ、計算に含めないアップグレードを購入する */
    setInterval(function(){
        // canBuy()で購入可否判定
        // 既に買ったものはbought==1で弾く
        for (let i = 0; i < Game.UpgradesInStore.length; i++){
            let inStore = Game.UpgradesInStore[i];
            if (inStore.canBuy() && inStore.bought != 1 && !isUpgrade(inStore) && !isBypassed(inStore) && inStore.pool  != "toggle") {
                if (inStore.getPrice() <= Game.cookies) {
                    try{inStore.buy(1);} catch(e){inStore.buy();}
                }
            }
        }
    }, MINIMUM_TIMEOUT);

    /** Heavenly ChipをTARGET_HC枚稼ぐ毎にAscendする */
    setInterval(function(){

        if (Game.ascendMeterLevel - start_hc < TARGET_HC) return;

        Game.Ascend(1);

        setTimeout(function() {
            let oLegacy = Game.UpgradesById[363];
            if (oLegacy.bought == 0 && oLegacy.getPrice() <= Game.heavenlyChips) oLegacy.buy();

            // "Permanent upgrade slot" 以外のprestigeを購入できるだけ購入する
            let toBuy;
            do {
                toBuy = [];
                for (let i = 0; i < Game.UpgradesById.length; i++) {
                    let oPrestige = Game.UpgradesById[i];
                    if (oPrestige.pool == "prestige" && oPrestige.name.indexOf("Permanent upgrade slot") == -1 && oPrestige.canBePurchased && oPrestige.bought == 0 && oPrestige.getPrice() <= Game.heavenlyChips) toBuy.push(oPrestige);
                }

                // 配列を価格の順番に並び替える
                toBuy.sort(function(a,b) {
                    if (a.getPrice() < b.getPrice()) {
                        return -1;
                    } else {
                        return 1;
                    }
                });

                // 最も安いものを買う
                // 依存関係を再構築して再度一番安いものを検索する
                try {
                    toBuy[0].buy();
                } catch (e) {}
            } while (toBuy.length != 0);

        }, 5 * 1000)
        
        setTimeout(function(){Game.Reincarnate(1); start_hc = Game.ascendMeterLevel;}, 7 * 1000);
    }, MINIMUM_TIMEOUT);

    /**
     * UPGRADE_NAME に登録されたアップグレードは、施設と同時に効果を加味して購入する
     * @param {Object} obj Game.Upgrades
     * @returns {Boolean} 真偽値
     */
    function isUpgrade(obj) {
        for (let i = 0; i < UPGRADE_NAME.length; i++) {
            for (let j = 0; j < UPGRADE_NAME[i].length; j++) {
                if (obj.name == UPGRADE_NAME[i][j]) return true;
            }
        }
        return false;
    }
    /**
     * UPGRADE_TO_BYPASS に登録されたアップグレードは常に無視する
     * @param {Object} obj Game.Upgrades
     * @returns {Boolean} 真偽値
     */
    function isBypassed(obj) {
        return UPGRADE_TO_BYPASS.includes(obj.name) ? true : false;
    }

    /** BACKUP_INTERVAL毎にセーブをダウンロードさせる */
    setInterval(function() {
        Game.toSave=true;

        setTimeout(function() {
            Game.ExportSave();
            const save = document.getElementById("textareaPrompt").value;
            Game.ClosePrompt();

            const blob = new Blob([ save ], { "type" : "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.download = "cc_bkp_" + Date.now() + ".txt";
            a.href = url;
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }, 1000);
    }, BACKUP_INTERVAL);
})();
