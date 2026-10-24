(function () {
  "use strict";

  const STORAGE_KEY = "baltracker_language_v1";
  const LANGUAGES = {
    en: { name: "English", label: "Language", htmlLang: "en-NG" },
    yo: { name: "Yorùbá", label: "Èdè", htmlLang: "yo" },
    ha: { name: "Hausa", label: "Harshe", htmlLang: "ha" },
    ig: { name: "Igbo", label: "Asụsụ", htmlLang: "ig" },
    pcm: { name: "Nigerian Pidgin", label: "Language", htmlLang: "pcm" }
  };

  // Keys are the English interface strings. Dynamic amounts, names, descriptions,
  // and transaction data are not translated; only recognized interface text is.
  const TRANSLATIONS = {
    "Language": { yo: "Èdè", ha: "Harshe", ig: "Asụsụ", pcm: "Language" },
    "Dashboard": { yo: "Akopọ", ha: "Takaitaccen bayani", ig: "Nchịkọta", pcm: "Your summary" },
    "Sales": { yo: "Títà", ha: "Tallace-tallace", ig: "Ahịa e rere", pcm: "Sales" },
    "Expenses": { yo: "Ìnáwó", ha: "Kuɗaɗen kashewa", ig: "Mmefu", pcm: "Money wey we spend" },
    "Customer Credit": { yo: "Gbèsè àwọn oníbàárà", ha: "Bashin kwastomomi", ig: "Ụgwọ ndị ahịa ji gị", pcm: "Money customers owe you" },
    "Business Debit": { yo: "Gbèsè ìṣòwò", ha: "Bashin kasuwanci", ig: "Ụgwọ azụmahịa ji ndị ọzọ", pcm: "Money wey business owe" },
    "Activity": { yo: "Ìṣe", ha: "Ayyuka", ig: "Ihe ndị mere", pcm: "Activity" },
    "Customers & Vendors": { yo: "Àwọn oníbàárà àti olùpèsè", ha: "Kwastomomi da masu kaya", ig: "Ndị ahịa na ndị na-ebubata ngwa ahịa", pcm: "Customers and suppliers" },
    "Pending Requests": { yo: "Àwọn ìbéèrè tó ń dúró", ha: "Buƙatun da ke jira", ig: "Arịrịọ na-eche", pcm: "Requests wey dey wait" },
    "Settings": { yo: "Àwọn ètò", ha: "Saituna", ig: "Ntọala", pcm: "Settings" },
    "Log out": { yo: "Jáde", ha: "Fita", ig: "Pụọ", pcm: "Sign out" },
    "Sign out": { yo: "Jáde", ha: "Fita", ig: "Pụọ", pcm: "Sign out" },
    "Good day 👋": { yo: "Ẹ kú ọjọ́ 👋", ha: "Barka da rana 👋", ig: "Ndewo 👋", pcm: "How far 👋" },
    "Know your money. Control your business.": { yo: "Mọ owó rẹ. Ṣàkóso ìṣòwò rẹ.", ha: "San ku kuɗin ku. Sarrafa kasuwancin ku.", ig: "Mara ego gị. Jikwaa azụmahịa gị.", pcm: "Know your money. Run your business better." },
    "Cash Position": { yo: "Ipo owó", ha: "Matsayin kuɗi", ig: "Ọnọdụ ego", pcm: "Money wey dey hand" },
    "Money Owed to Me": { yo: "Owó tí wọ́n jẹ mí", ha: "Kuɗin da ake bina", ig: "Ego ndị mmadụ ji gị", pcm: "Money people dey owe me" },
    "Money I Owe": { yo: "Owó tí mo jẹ", ha: "Kuɗin da nake bi", ig: "Ego i ji ndị ọzọ", pcm: "Money wey I owe" },
    "Financial Health": { yo: "Ìlera owó", ha: "Lafiyar kuɗi", ig: "Ahụike ego", pcm: "How your business money dey" },
    "Recent Activity": { yo: "Ìṣe tuntun", ha: "Ayyukan baya-bayan nan", ig: "Ihe mere nso nso a", pcm: "Recent activity" },
    "Payment Reminders": { yo: "Ìrántí ìsanwó", ha: "Tunatarwar biyan kuɗi", ig: "Ihe ncheta ịkwụ ụgwọ", pcm: "Payment reminders" },
    "Next 7 days": { yo: "Ọjọ́ 7 tó ń bọ̀", ha: "Kwanaki 7 masu zuwa", ig: "Ụbọchị asaa na-abịa", pcm: "Next 7 days" },
    "Add Transaction": { yo: "Fi ìṣòwò kún un", ha: "Ƙara ma'amala", ig: "Tinye azụmahịa", pcm: "Add transaction" },
    "+ Add Transaction": { yo: "+ Fi ìṣòwò kún un", ha: "+ Ƙara ma'amala", ig: "+ Tinye azụmahịa", pcm: "+ Add transaction" },
    "Add Sale": { yo: "Fi títà kún un", ha: "Ƙara tallace-tallace", ig: "Tinye ahịa", pcm: "Add sale" },
    "Add Expense": { yo: "Fi ìnáwó kún un", ha: "Ƙara kuɗin kashewa", ig: "Tinye mmefu", pcm: "Add expense" },
    "Add Credit": { yo: "Fi gbèsè kún un", ha: "Ƙara bashi", ig: "Tinye ụgwọ", pcm: "Add customer credit" },
    "Add Debit": { yo: "Fi gbèsè ìṣòwò kún un", ha: "Ƙara bashin kasuwanci", ig: "Tinye ụgwọ azụmahịa", pcm: "Add business debt" },
    "Transaction Type": { yo: "Irú ìṣòwò", ha: "Nau'in ma'amala", ig: "Ụdị azụmahịa", pcm: "Transaction type" },
    "Select transaction type": { yo: "Yan irú ìṣòwò", ha: "Zaɓi nau'in ma'amala", ig: "Họrọ ụdị azụmahịa", pcm: "Choose transaction type" },
    "Sale": { yo: "Títà", ha: "Tallace-tallace", ig: "Ahịa", pcm: "Sale" },
    "Expense": { yo: "Ìnáwó", ha: "Kuɗin kashewa", ig: "Mmefu", pcm: "Money spent" },
    "Credit": { yo: "Gbèsè", ha: "Bashi", ig: "Ụgwọ", pcm: "Customer credit" },
    "Debit": { yo: "Gbèsè ìsanwó", ha: "Bashin biya", ig: "Ụgwọ ịkwụ ụgwọ", pcm: "Business debt" },
    "Customer": { yo: "Oníbàárà", ha: "Kwastoma", ig: "Onye ahịa", pcm: "Customer" },
    "Vendor": { yo: "Olùpèsè", ha: "Mai kaya", ig: "Onye na-ebubata ngwa ahịa", pcm: "Supplier" },
    "Amount": { yo: "Iye owó", ha: "Adadin kuɗi", ig: "Ego ole", pcm: "Amount" },
    "Date": { yo: "Ọjọ́", ha: "Kwanan wata", ig: "Ụbọchị", pcm: "Date" },
    "Payment Due Date": { yo: "Ọjọ́ ìparí ìsanwó", ha: "Ranar biyan kuɗi", ig: "Ụbọchị ngwụcha ịkwụ ụgwọ", pcm: "Payment due date" },
    "Description": { yo: "Àpèjúwe", ha: "Bayani", ig: "Nkọwa", pcm: "Description" },
    "e.g. Stock purchase or goods sold": { yo: "fún àpẹẹrẹ, rírà ọjà tàbí títà ọjà", ha: "misali, sayen kaya ko sayar da kaya", ig: "dịka, ịzụta ngwaahịa ma ọ bụ ire ya", pcm: "e.g. stock we buy or goods we sell" },
    "Save Changes": { yo: "Fi àwọn àyípadà pamọ́", ha: "Ajiye canje-canje", ig: "Chekwaa mgbanwe", pcm: "Save changes" },
    "Cancel": { yo: "Fagilé", ha: "Soke", ig: "Kagbuo", pcm: "Cancel" },
    "Record Payment": { yo: "Gba ìsanwó sílẹ̀", ha: "Yi rijistar biyan kuɗi", ig: "Dekọọ ịkwụ ụgwọ", pcm: "Record payment" },
    "Outstanding Balance": { yo: "Owó tó kù", ha: "Ragowar kuɗi", ig: "Ụgwọ fọdụrụ", pcm: "Balance wey remain" },
    "Payment Amount": { yo: "Iye ìsanwó", ha: "Adadin biyan kuɗi", ig: "Ego a na-akwụ", pcm: "Payment amount" },
    "Payment Date": { yo: "Ọjọ́ ìsanwó", ha: "Ranar biyan kuɗi", ig: "Ụbọchị ịkwụ ụgwọ", pcm: "Payment date" },
    "Edit Transaction": { yo: "Ṣàtúnṣe ìṣòwò", ha: "Gyara ma'amala", ig: "Dezie azụmahịa", pcm: "Edit transaction" },
    "Save Changes": { yo: "Fi àwọn àyípadà pamọ́", ha: "Ajiye canje-canje", ig: "Chekwaa mgbanwe", pcm: "Save changes" },
    "Search...": { yo: "Wá...", ha: "Nema...", ig: "Chọọ...", pcm: "Search..." },
    "Search": { yo: "Wá", ha: "Nema", ig: "Chọọ", pcm: "Search" },
    "Refresh": { yo: "Tún un ṣe", ha: "Sabunta", ig: "Melite", pcm: "Refresh" },
    "No upcoming dated payments": { yo: "Kò sí ìsanwó tó sún mọ́lé pẹ̀lú ọjọ́", ha: "Babu biyan kuɗi mai zuwa da aka sanya rana", ig: "Enweghị ịkwụ ụgwọ dị nso nwere ụbọchị", pcm: "No upcoming payment dates" },
    "Add due dates to credit or debit transactions to see reminders.": { yo: "Fi ọjọ́ ìparí kún àwọn gbèsè láti rí ìrántí.", ha: "Ƙara ranakun biya ga basussuka domin ganin tunatarwa.", ig: "Tinye ụbọchị ngwụcha n'ụgwọ iji hụ ihe ncheta.", pcm: "Add due dates to debts to see reminders." },
    "Settings": { yo: "Àwọn ètò", ha: "Saituna", ig: "Ntọala", pcm: "Settings" },
    "Manage your BalTracker preferences.": { yo: "Ṣàkóso àwọn àṣàyàn BalTracker rẹ.", ha: "Sarrafa zaɓuɓɓukan BalTracker ɗinka.", ig: "Jikwaa nhọrọ BalTracker gị.", pcm: "Manage your BalTracker settings." },
    "Business Settings": { yo: "Àwọn ètò ìṣòwò", ha: "Saitunan kasuwanci", ig: "Ntọala azụmahịa", pcm: "Business settings" },
    "Business Name": { yo: "Orúkọ ìṣòwò", ha: "Sunan kasuwanci", ig: "Aha azụmahịa", pcm: "Business name" },
    "Business Owner": { yo: "Olówó ìṣòwò", ha: "Mai kasuwanci", ig: "Onye nwe azụmahịa", pcm: "Business owner" },
    "Enter business owner name": { yo: "Tẹ orúkọ olówó ìṣòwò sí", ha: "Shigar da sunan mai kasuwanci", ig: "Tinye aha onye nwe azụmahịa", pcm: "Enter business owner name" },
    "BalTracker Business ID": { yo: "Nọ́mbà ìdánimọ̀ ìṣòwò BalTracker", ha: "ID na kasuwancin BalTracker", ig: "Nọmba ID azụmahịa BalTracker", pcm: "BalTracker Business ID" },
    "Register your business name to generate a unique ID customers can use to find your business.": { yo: "Forúkọsílẹ̀ orúkọ ìṣòwò rẹ láti ṣẹ̀dá ID aláìlẹ́gbẹ́ tí àwọn oníbàárà lè lò láti rí ọ.", ha: "Yi rijistar sunan kasuwancinka domin samar da ID na musamman da kwastomomi za su yi amfani da shi wajen nemo ka.", ig: "Debanye aha azụmahịa gị ka e mepụta ID pụrụ iche ndị ahịa ga-eji chọta azụmahịa gị.", pcm: "Register your business name to get a unique ID wey customers fit use find your business." },
    "Currency": { yo: "Owó-orí", ha: "Kuɗin ƙasa", ig: "Ego", pcm: "Currency" },
    "Local Data": { yo: "Àwọn dátà agbègbè", ha: "Bayanan na'ura", ig: "Data dị na ngwaọrụ", pcm: "Data for this device" },
    "This prototype stores your transactions, customers and vendors locally in your browser.": { yo: "Àpẹẹrẹ yìí ń fi àwọn ìṣòwò, oníbàárà àti olùpèsè pamọ́ sínú ẹ̀rọ aṣàwárí rẹ.", ha: "Wannan samfurin yana adana ma'amaloli, kwastomomi da masu kaya a burauzar ɗinka.", ig: "Ihe nlereanya a na-echekwa azụmahịa, ndị ahịa na ndị na-ebubata ngwa ahịa n'ime ihe nchọgharị gị.", pcm: "This test version dey save your transactions, customers and suppliers for your browser." },
    "Clear All Data": { yo: "Pa gbogbo dátà rẹ́", ha: "Goge duk bayanai", ig: "Hichapụ data niile", pcm: "Clear all data" },
    "Welcome back": { yo: "Ẹ kú àbọ̀ padà", ha: "Barka da dawowa", ig: "Nnọọ ọzọ", pcm: "You don come back" },
    "Sign in to manage your business finances.": { yo: "Wọlé láti ṣàkóso owó ìṣòwò rẹ.", ha: "Shiga domin sarrafa kuɗin kasuwancinka.", ig: "Banye iji jikwaa ego azụmahịa gị.", pcm: "Sign in to manage your business money." },
    "Sign In": { yo: "Wọlé", ha: "Shiga", ig: "Banye", pcm: "Sign in" },
    "Sign Up": { yo: "Forúkọsílẹ̀", ha: "Yi rajista", ig: "Debanye aha", pcm: "Sign up" },
    "Forgot password?": { yo: "Ṣé o gbàgbé ọ̀rọ̀ aṣínà?", ha: "Ka manta kalmar sirri?", ig: "Chefuru paswọọdụ?", pcm: "You forget password?" },
    "Full Name": { yo: "Orúkọ kíkún", ha: "Cikakken suna", ig: "Aha zuru ezu", pcm: "Full name" },
    "Full name": { yo: "Orúkọ kíkún", ha: "Cikakken suna", ig: "Aha zuru ezu", pcm: "Full name" },
    "Account type": { yo: "Irú àkọọ́lẹ̀", ha: "Nau'in asusu", ig: "Ụdị akaụntụ", pcm: "Account type" },
    "Business Owner": { yo: "Olówó ìṣòwò", ha: "Mai kasuwanci", ig: "Onye nwe azụmahịa", pcm: "Business owner" },
    "Enter your business name": { yo: "Tẹ orúkọ ìṣòwò rẹ sí", ha: "Shigar da sunan kasuwancinka", ig: "Tinye aha azụmahịa gị", pcm: "Enter your business name" },
    "Email address": { yo: "Àdírẹ́sì ímeèlì", ha: "Adireshin imel", ig: "Adreesị ozi-e", pcm: "Email address" },
    "Password": { yo: "Ọ̀rọ̀ aṣínà", ha: "Kalmar sirri", ig: "Paswọọdụ", pcm: "Password" },
    "Confirm Password": { yo: "Jẹ́rìí ọ̀rọ̀ aṣínà", ha: "Tabbatar da kalmar sirri", ig: "Kwenye paswọọdụ", pcm: "Confirm password" },
    "Keep me signed in": { yo: "Jẹ́ kí n wà níwọlé", ha: "Ci gaba da sa ni a shiga", ig: "Debe m ka m banye", pcm: "Keep me signed in" },
    "Reset Password": { yo: "Tún ọ̀rọ̀ aṣínà ṣe", ha: "Sake saita kalmar sirri", ig: "Tọgharịa paswọọdụ", pcm: "Reset password" },
    "Customer portal": { yo: "Ojú-ọ̀nà oníbàárà", ha: "Shafin kwastoma", ig: "Ọnụ ụzọ onye ahịa", pcm: "Customer page" },
    "Your BalTracker customer space": { yo: "Ààyè oníbàárà BalTracker rẹ", ha: "Shafin kwastoma na BalTracker", ig: "Ebe BalTracker gị dịka onye ahịa", pcm: "Your BalTracker customer space" },
    "Send a transaction to a business for authorization, follow its status, and keep track of your activity in one place.": { yo: "Fi ìṣòwò ránṣẹ́ sí ilé-iṣẹ́ fún ìfọwọ́sí, tẹ̀lé ipò rẹ̀, kí o sì rí ìṣe rẹ ní ibì kan.", ha: "Aika ma'amala ga kasuwanci don amincewa, bibiyar matsayinta, da duba ayyukanka a wuri guda.", ig: "Zipụ azụmahịa ka onye nwe ya kwado ya, soro ọnọdụ ya, ma debe ihe omume gị n'otu ebe.", pcm: "Send transaction make business owner approve am, check the status, and see your activity one place." },
    "Requests sent": { yo: "Àwọn ìbéèrè tí a fi ránṣẹ́", ha: "Buƙatun da aka aika", ig: "Arịrịọ ezitere", pcm: "Requests wey you send" },
    "Awaiting approval": { yo: "Ń dúró de ìfọwọ́sí", ha: "Ana jiran amincewa", ig: "Na-eche nkwado", pcm: "Dey wait for approval" },
    "Approved requests": { yo: "Àwọn ìbéèrè tí a fọwọ́sí", ha: "Buƙatun da aka amince da su", ig: "Arịrịọ akwadoro", pcm: "Requests wey dem approve" },
    "Get started": { yo: "Bẹ̀rẹ̀", ha: "Fara", ig: "Bido", pcm: "Start here" },
    "Recent requests": { yo: "Àwọn ìbéèrè tuntun", ha: "Buƙatun baya-bayan nan", ig: "Arịrịọ ọhụrụ", pcm: "Recent requests" },
    "Send transaction for authorization": { yo: "Fi ìṣòwò ránṣẹ́ fún ìfọwọ́sí", ha: "Aika ma'amala don amincewa", ig: "Zipụ azụmahịa ka akwado ya", pcm: "Send transaction for approval" },
    "Fill in the transaction and send it to the business owner for approval.": { yo: "Kún àlàyé ìṣòwò kí o sì fi ránṣẹ́ sí olówó ìṣòwò fún ìfọwọ́sí.", ha: "Cika bayanan ma'amala sannan aika wa mai kasuwanci don amincewa.", ig: "Dee nkọwa azụmahịa ma zipụ ya ka onye nwe azụmahịa kwado ya.", pcm: "Fill the transaction details and send am to the business owner for approval." },
    "My transaction requests": { yo: "Àwọn ìbéèrè ìṣòwò mi", ha: "Buƙatun ma'amalolina", ig: "Arịrịọ azụmahịa m", pcm: "My transaction requests" },
    "Track requests you have sent to businesses.": { yo: "Tẹ̀lé àwọn ìbéèrè tí o fi ránṣẹ́ sí àwọn ilé-iṣẹ́.", ha: "Bibiyi buƙatun da ka aika wa kasuwanci.", ig: "Soro arịrịọ ị zigara azụmahịa.", pcm: "Check the requests wey you send to businesses." },
    "Your account": { yo: "Àkọọ́lẹ̀ rẹ", ha: "Asusunka", ig: "Akaụntụ gị", pcm: "Your account" },
    "Your customer account is separate from each business's private financial records.": { yo: "Àkọọ́lẹ̀ oníbàárà rẹ yàtọ̀ sí àwọn àkọsílẹ̀ owó ìkọ̀kọ̀ ilé-iṣẹ́ kọ̀ọ̀kan.", ha: "Asusun kwastomanka ya bambanta da bayanan kuɗi na sirri na kowane kasuwanci.", ig: "Akaụntụ onye ahịa gị dị iche na ndekọ ego nzuzo nke azụmahịa ọ bụla.", pcm: "Your customer account no dey show each business private money records." },
    "Display name": { yo: "Orúkọ ìfihàn", ha: "Sunan nunawa", ig: "Aha ngosi", pcm: "Display name" },
    "Account email": { yo: "Ímeèlì àkọọ́lẹ̀", ha: "Imel na asusu", ig: "Ozi-e akaụntụ", pcm: "Account email" },
    "No account needed. Find the business using its Business ID and send your request for the owner to review.": { yo: "Kò nílò àkọọ́lẹ̀. Lo ID ìṣòwò láti rí ilé-iṣẹ́ kí o sì fi ìbéèrè ránṣẹ́ fún olówó rẹ̀.", ha: "Ba a buƙatar asusu. Yi amfani da ID na kasuwanci don nemo shi sannan ka aika buƙatarka ga mai kasuwancin.", ig: "Achọghị akaụntụ. Jiri ID azụmahịa chọta ya ma zipụ arịrịọ ka onye nwe ya nyochaa.", pcm: "You no need account. Use the Business ID find the business and send your request to the owner." },
    "Make a transaction": { yo: "Ṣe ìṣòwò", ha: "Yi ma'amala", ig: "Mee azụmahịa", pcm: "Make a transaction" },
    "Your name": { yo: "Orúkọ rẹ", ha: "Sunanka", ig: "Aha gị", pcm: "Your name" },
    "Enter your name": { yo: "Tẹ orúkọ rẹ sí", ha: "Shigar da sunanka", ig: "Tinye aha gị", pcm: "Enter your name" },
    "Business ID": { yo: "ID ìṣòwò", ha: "ID na kasuwanci", ig: "ID azụmahịa", pcm: "Business ID" },
    "Find": { yo: "Wá", ha: "Nemo", ig: "Chọta", pcm: "Find" },
    "Find business": { yo: "Wá ilé-iṣẹ́", ha: "Nemo kasuwanci", ig: "Chọta azụmahịa", pcm: "Find business" },
    "Transaction description": { yo: "Àpèjúwe ìṣòwò", ha: "Bayanin ma'amala", ig: "Nkọwa azụmahịa", pcm: "Transaction description" },
    "Describe the purchase, service, investment, or other arrangement": { yo: "Ṣàlàyé rírà, iṣẹ́, ìdókòwò tàbí ètò mìíràn", ha: "Bayyana saye, sabis, zuba jari ko wani tsari", ig: "Kọwaa ịzụta, ọrụ, itinye ego ma ọ bụ ndokwa ọzọ", pcm: "Describe wetin the purchase, service or arrangement concern." },
    "Amount (₦)": { yo: "Iye owó (₦)", ha: "Adadin kuɗi (₦)", ig: "Ego ole (₦)", pcm: "Amount (₦)" },
    "Payment arrangement": { yo: "Ètò ìsanwó", ha: "Tsarin biyan kuɗi", ig: "Nhazi ịkwụ ụgwọ", pcm: "Payment arrangement" },
    "Pay now": { yo: "Sanwó nísinsìnyí", ha: "Biya yanzu", ig: "Kwụọ ugbu a", pcm: "Pay now" },
    "Pay later / credit": { yo: "Sanwó lẹ́yìn / gbèsè", ha: "Biya daga baya / bashi", ig: "Kwụọ ma emechaa / ụgwọ", pcm: "Pay later / credit" },
    "Request pay-later / credit": { yo: "Bẹ̀rẹ̀ ìsanwó lẹ́yìn / gbèsè", ha: "Nemi biya daga baya / bashi", ig: "Rịọ ịkwụ ụgwọ ma emechaa / ụgwọ", pcm: "Ask to pay later / take credit" },
    "Send for authorization": { yo: "Fi ránṣẹ́ fún ìfọwọ́sí", ha: "Aika don amincewa", ig: "Zipụ ka akwado ya", pcm: "Send for approval" },
    "Clear form": { yo: "Pa fọ́ọ̀mù rẹ́", ha: "Share fom", ig: "Hichapụ fọm", pcm: "Clear form" },
    "Your request stays pending until the business owner reviews it. Keep the reference code shown after submission.": { yo: "Ìbéèrè rẹ yóò dúró títí olówó ìṣòwò yóò fi ṣàyẹ̀wò rẹ̀. Pa kóòdù ìtọ́kasí mọ́.", ha: "Buƙatarka za ta jira har mai kasuwanci ya duba ta. Ajiye lambar tunani da aka nuna bayan aikawa.", ig: "Arịrịọ gị ga-echere ruo mgbe onye nwe azụmahịa nyochara ya. Debe koodu ntụaka ahụ.", pcm: "Your request go dey wait till the business owner check am. Keep the reference code after you send am." },
    "Check a request": { yo: "Ṣàyẹ̀wò ìbéèrè", ha: "Duba buƙata", ig: "Lelee arịrịọ", pcm: "Check request" },
    "Enter your reference code to check whether the owner has reviewed your request.": { yo: "Tẹ kóòdù ìtọ́kasí rẹ sí láti mọ bóyá olówó ti ṣàyẹ̀wò ìbéèrè náà.", ha: "Shigar da lambar tunani don duba ko mai kasuwanci ya duba buƙatarka.", ig: "Tinye koodu ntụaka ka ị mara ma onye nwe ya enyochala arịrịọ gị.", pcm: "Enter your reference code to check if the owner don review your request." },
    "Transaction reference": { yo: "Ìtọ́kasí ìṣòwò", ha: "Lambar tunani ta ma'amala", ig: "Ntụaka azụmahịa", pcm: "Transaction reference" },
    "Check status": { yo: "Ṣàyẹ̀wò ipò", ha: "Duba matsayi", ig: "Lelee ọnọdụ", pcm: "Check status" },
    "Sign in or create an account": { yo: "Wọlé tàbí ṣẹ̀dá àkọọ́lẹ̀", ha: "Shiga ko ƙirƙiri asusu", ig: "Banye ma ọ bụ mepụta akaụntụ", pcm: "Sign in or create account" },
    "Proposed amount": { yo: "Iye owó tí a dábàá", ha: "Adadin da aka gabatar", ig: "Ego a tụrụ aro", pcm: "Proposed amount" },
    "Payment arrangement": { yo: "Ètò ìsanwó", ha: "Tsarin biyan kuɗi", ig: "Nhazi ịkwụ ụgwọ", pcm: "Payment arrangement" },
    "Review request": { yo: "Ṣàyẹ̀wò ìbéèrè", ha: "Duba buƙata", ig: "Nyochaa arịrịọ", pcm: "Review request" },
    "Approve & record": { yo: "Fọwọ́sí kí o sì gba sílẹ̀", ha: "Amince kuma yi rajista", ig: "Kwado ma dekọọ", pcm: "Approve and record" },
    "Decline request": { yo: "Kọ ìbéèrè sílẹ̀", ha: "Ƙi amincewa da buƙata", ig: "Jụ arịrịọ", pcm: "Decline request" },
    "Note to customer": { yo: "Àkíyèsí sí oníbàárà", ha: "Saƙo ga kwastoma", ig: "Ozi nye onye ahịa", pcm: "Note to customer" },
    "Pending": { yo: "Ń dúró", ha: "Ana jira", ig: "Na-eche", pcm: "Dey wait" },
    "Approved": { yo: "Fọwọ́sí", ha: "An amince", ig: "Akwadoro", pcm: "Approved" },
    "Declined": { yo: "A kọ̀ ọ́", ha: "An ƙi", ig: "Ajụrụ", pcm: "Declined" },
    "No requests found.": { yo: "A kò rí ìbéèrè kankan.", ha: "Ba a sami buƙata ba.", ig: "Ahụghị arịrịọ ọ bụla.", pcm: "No request found." },
    "Search by business, description, amount, payment type or status…": { yo: "Wá nípasẹ̀ ilé-iṣẹ́, àpèjúwe, iye owó, irú ìsanwó tàbí ipò…", ha: "Nema ta kasuwanci, bayani, adadi, nau'in biya ko matsayi…", ig: "Chọọ site na azụmahịa, nkọwa, ego, ụdị ịkwụ ụgwọ ma ọ bụ ọnọdụ…", pcm: "Search business, description, amount, payment type or status…" }
  };

  const textState = new WeakMap();
  const attributeState = new WeakMap();
  let selectedLanguage = "en";
  let picker;
  let applying = false;

  function readLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && LANGUAGES[saved] ? saved : "en";
    } catch (error) {
      return "en";
    }
  }

  function translated(value, language) {
    const trimmed = String(value == null ? "" : value).trim();
    if (!trimmed || language === "en") return trimmed;
    const entry = TRANSLATIONS[trimmed];
    return entry && entry[language] ? entry[language] : trimmed;
  }

  function preserveSpace(original, replacement) {
    const leading = (original.match(/^\s*/) || [""])[0];
    const trailing = (original.match(/\s*$/) || [""])[0];
    const end = original.length - trailing.length;
    const core = original.slice(leading.length, end);
    if (!core) return original;
    return leading + replacement + trailing;
  }

  function shouldSkipText(node) {
    const parent = node && node.parentElement;
    if (!parent) return true;
    if (parent.closest("[data-no-translate], script, style, noscript, textarea, code, pre")) return true;
    if (parent.isContentEditable) return true;
    return false;
  }

  function translateTextNode(node, language) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkipText(node)) return;
    const current = node.nodeValue || "";
    let state = textState.get(node);
    if (!state) {
      state = { original: current, lastRendered: null };
      textState.set(node, state);
    } else if (state.lastRendered !== null && current !== state.lastRendered) {
      // Application code may replace a label dynamically. Treat that new value as source text.
      state.original = current;
      state.lastRendered = null;
    }
    const core = state.original.trim();
    const next = core ? preserveSpace(state.original, translated(core, language)) : state.original;
    if (current !== next) node.nodeValue = next;
    state.lastRendered = next;
  }

  function translateAttribute(element, attribute, language) {
    if (!element || element.closest("[data-no-translate]")) return;
    const current = element.getAttribute(attribute);
    if (current == null || !current.trim()) return;
    let state = attributeState.get(element);
    if (!state) {
      state = {};
      attributeState.set(element, state);
    }
    if (!state[attribute]) state[attribute] = { original: current, lastRendered: null };
    const item = state[attribute];
    if (item.lastRendered !== null && current !== item.lastRendered) {
      item.original = current;
      item.lastRendered = null;
    }
    const next = translated(item.original, language);
    if (current !== next) element.setAttribute(attribute, next);
    item.lastRendered = next;
  }

  function translateSubtree(root, language) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, language);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root !== document) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      ["placeholder", "title", "aria-label", "aria-placeholder"].forEach(attr => translateAttribute(root, attr, language));
      if (root.closest && root.closest("[data-no-translate]")) return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateTextNode(node, language);
    if (root.querySelectorAll) {
      root.querySelectorAll("[placeholder], [title], [aria-label], [aria-placeholder]").forEach(element => {
        ["placeholder", "title", "aria-label", "aria-placeholder"].forEach(attr => translateAttribute(element, attr, language));
      });
    }
  }

  function mountPicker() {
    if (document.getElementById("baltracker-language-picker")) return;
    const wrapper = document.createElement("div");
    wrapper.id = "baltracker-language-picker";
    wrapper.className = "bt-language-picker";
    wrapper.setAttribute("data-no-translate", "true");
    wrapper.innerHTML =
      '<label for="btLanguageSelect" id="btLanguageLabel">Language</label>' +
      '<select id="btLanguageSelect" aria-label="Language">' +
      '<option value="en">English</option>' +
      '<option value="yo">Yorùbá</option>' +
      '<option value="ha">Hausa</option>' +
      '<option value="ig">Igbo</option>' +
      '<option value="pcm">Nigerian Pidgin</option>' +
      '</select>';

    const style = document.createElement("style");
    style.textContent =
      ".bt-language-picker{display:flex;align-items:center;gap:6px;flex:0 1 auto;min-width:0;padding:5px 8px;border:1px solid #dbe3ec;border-radius:10px;background:#fff;color:#334155;font:600 11px/1.3 system-ui,sans-serif;}" +
      ".bt-language-picker label{white-space:nowrap;font-size:11px;font-weight:700;color:#64748b;}" +
      ".bt-language-picker select{width:auto;min-width:78px;max-width:145px;border:0;background:transparent;color:inherit;font:inherit;outline-offset:3px;padding:2px;}" +
      ".bt-language-picker select:focus-visible{outline:2px solid #0f62fe;border-radius:4px;}" +
      "@media(max-width:420px){.bt-language-picker{gap:4px;padding:4px 6px}.bt-language-picker label{display:none}.bt-language-picker select{min-width:88px;max-width:125px}}";
    document.head.appendChild(style);

    const ownerHeader = document.querySelector(".topbar-right");
    const loginCard = document.querySelector(".login-card");
    const guestBrand = document.querySelector(".shell .brand");
    if (ownerHeader) {
      const avatar = ownerHeader.querySelector("#userAvatar");
      if (avatar) ownerHeader.insertBefore(wrapper, avatar);
      else ownerHeader.appendChild(wrapper);
    } else if (loginCard) {
      const brand = loginCard.querySelector(".login-brand");
      if (brand && brand.nextSibling) loginCard.insertBefore(wrapper, brand.nextSibling);
      else if (brand) brand.insertAdjacentElement("afterend", wrapper);
      else loginCard.insertBefore(wrapper, loginCard.firstChild);
      wrapper.style.justifyContent = "center";
      wrapper.style.width = "fit-content";
      wrapper.style.margin = "0 auto 16px";
    } else if (guestBrand) {
      guestBrand.insertAdjacentElement("afterend", wrapper);
      wrapper.style.width = "fit-content";
      wrapper.style.margin = "0 0 14px auto";
    } else {
      document.body.insertBefore(wrapper, document.body.firstChild);
    }

    const select = wrapper.querySelector("select");
    select.addEventListener("change", () => setLanguage(select.value));
  }

  function setLanguage(language) {
    selectedLanguage = LANGUAGES[language] ? language : "en";
    try { localStorage.setItem(STORAGE_KEY, selectedLanguage); } catch (error) {}
    document.documentElement.lang = LANGUAGES[selectedLanguage].htmlLang;
    const select = document.getElementById("btLanguageSelect");
    const label = document.getElementById("btLanguageLabel");
    if (select) select.value = selectedLanguage;
    if (label) label.textContent = LANGUAGES[selectedLanguage].label;
    applying = true;
    translateSubtree(document.body, selectedLanguage);
    applying = false;
    window.dispatchEvent(new CustomEvent("baltracker:languagechanged", { detail: { language: selectedLanguage } }));
  }

  function init() {
    mountPicker();
    selectedLanguage = readLanguage();
    setLanguage(selectedLanguage);

    const observer = new MutationObserver(mutations => {
      if (applying) return;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node !== picker && !(node.nodeType === Node.ELEMENT_NODE && node.id === "baltracker-language-picker")) {
            translateSubtree(node, selectedLanguage);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.BalTrackerLanguage = {
    getLanguage: () => selectedLanguage,
    setLanguage,
    translate: key => translated(key, selectedLanguage),
    languages: Object.keys(LANGUAGES)
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();