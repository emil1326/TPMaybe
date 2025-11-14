let contentScrollPosition = 0;
let search = "";
let endOfData = false;
let pageManager;
let categories = [];
let selectedCategory = "";
Init_UI();

function Init_UI() {
    pageManager = new PageManager('scrollPanel', 'postsPanel', 'sample', renderPosts);
    $("#actionTitle").text("Nouvelles");
    $("#search").show();
    $("#createPost").show();
    $("#abort").hide();
    $('#aboutContainer').hide();
    $('#formContainer').hide();
    $("#errorContainer").hide();

    $('#abort').on("click", async function () {
        $("#aboutContainer").hide();
        $("#errorContainer").hide();
        $('#formContainer').hide();
        $("#abort").hide();
        $("#search").show();
        $("#createPost").show();
        $("#scrollPanel").show();
        $("#actionTitle").text("Nouvelles");
        pageManager.reset();
    });

    $('#createPost').on("click", function () {
        renderCreatePostForm();
    });

    $('#aboutCmd').on("click", function () {
        renderAbout();
    });

    $("#searchKey").on("change", () => {
        doSearch();
    });

    $('#doSearch').on('click', () => {
        doSearch();
    });

    pageManager.reset();
    // start periodic ETag refresh: when ETag changes, update visible list
    API.start_Periodic_Refresh(async () => { await pageManager.update(); });
}

function doSearch() {
    search = $("#searchKey").val().replace(' ', ',');
    pageManager.reset();
}

function renderAbout() {
    // pause periodic refresh while showing about
    API.stop_Periodic_Refresh();
    $("#scrollPanel").hide();
    $('#formContainer').hide();
    $("#abort").show();
    $("#search").hide();
    $("#createPost").hide();
    $("#actionTitle").text("À propos...");
    $("#aboutContainer").show();
}

function renderError(message) {
    removeWaitingGif();
    $("#scrollPanel").hide();
    $('#formContainer').hide();
    $("#aboutContainer").hide();
    $("#abort").show();
    $("#search").hide();
    $("#createPost").hide();
    $("#actionTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").empty();
    $("#errorContainer").append(
        $(`
            <span class="errorContainer">
                ${message}
            </span>
        `)
    );
}

async function renderPosts(container, queryString) {
    if (search != "") queryString += "&keywords=" + search;
    // sort by creation (desc) then category and apply selected category filter
    queryString += "&sort=-creation";
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    compileCategories();
    addWaitingGif();
    let endOfData = true;
    let posts = await API.getPosts(queryString);
    if (API.error)
        renderError(API.currentHttpError);
    else
        if (posts.length > 0) {
            posts.forEach(post => { container.append(renderPost(post)); });
            endOfData = false;
        } else console.log('end of data');
    removeWaitingGif();
    return endOfData;
}

function addWaitingGif() {
    $("#postsPanel").append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>"));
}

function removeWaitingGif() {
    $("#waitingGif").remove();
}

function convertToFrenchDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
}

function renderPost(post) {
    const postRow = $(`
        <div class="postRow" post_id="${post.Id}">
            <div class="postContainer">
                <div class="postLayout">
                    <div class="postHeader">
                        <span class="category">${post.Category}</span>
                        <span class="date">${convertToFrenchDate(post.Creation)}</span>
                    </div>
                    <h3 class="title">${post.Title}</h3>
                    <img src="${post.Image}" class="postImage" alt="${post.Title}">
                    <p class="description">${post.Text}</p>
                    <div class="commandPanel">
                        <i class="cmdIcon fa fa-pencil editCmd" editPostId="${post.Id}" title="Modifier"></i>
                        <i class="cmdIcon fa fa-trash deleteCmd" deletePostId="${post.Id}" title="Supprimer"></i>
                    </div>
                </div>
            </div>
        </div>
    `);

    postRow.find('.postContainer').on("click", function (e) {
        if (!$(e.target).hasClass('cmdIcon')) {
            renderPostDetails(post.Id);
        }
    });

    postRow.find('.editCmd').on("click", function (e) {
        e.stopPropagation();
        renderEditPostForm($(this).attr("editPostId"));
    });

    postRow.find('.deleteCmd').on("click", function (e) {
        e.stopPropagation();
        renderDeletePostForm($(this).attr("deletePostId"));
    });

    return postRow;
}

async function renderPostDetails(id) {
    addWaitingGif();
    let post = await API.getPost(id);
    removeWaitingGif();
    if (post !== null) {
        $("#scrollPanel").hide();
        $("#abort").show();
        $("#search").hide();
        $("#createPost").hide();
        $("#actionTitle").text("Détails de la nouvelle");
        $('#formContainer').show();
        $('#formContainer').empty();
        $('#formContainer').append(`
            <div class="postDetailsView">
                <div class="postDetailsHeader">
                    <span class="category">${post.Category}</span>
                    <span class="date">${convertToFrenchDate(post.Creation)}</span>
                </div>
                <h2 class="detailsTitle">${post.Title}</h2>
                <img src="${post.Image}" class="detailsImage" alt="${post.Title}">
                <div class="detailsText">${post.Text}</div>
            </div>
        `);
    } else {
        renderError("Nouvelle introuvable!");
    }
}

function renderCreatePostForm() {
    API.stop_Periodic_Refresh();
    renderPostForm();
}

async function renderEditPostForm(id) {
    API.stop_Periodic_Refresh();
    addWaitingGif();
    let post = await API.getPost(id);
    if (post !== null)
        renderPostForm(post);
    else
        renderError("Nouvelle introuvable!");
    removeWaitingGif();
}

async function renderDeletePostForm(id) {
    API.stop_Periodic_Refresh();
    addWaitingGif();
    let post = await API.getPost(id);
    removeWaitingGif();
    if (post !== null) {
        $("#scrollPanel").hide();
        $("#abort").show();
        $("#search").hide();
        $("#createPost").hide();
        $("#actionTitle").text("Retrait");
        $('#formContainer').show();
        $('#formContainer').empty();
        $('#formContainer').append(`
            <div class="postdeleteForm">
                <h4>Effacer la nouvelle suivante?</h4>
                <br>
                <div class="postRow" post_id="${post.Id}">
                    <div class="postContainer">
                        <div class="postLayout">
                            <div class="postHeader">
                                <span class="category">${post.Category}</span>
                                <span class="date">${convertToFrenchDate(post.Creation)}</span>
                            </div>
                            <h3 class="title">${post.Title}</h3>
                            <img src="${post.Image}" class="postImage" alt="${post.Title}">
                            <p class="description">${post.Text}</p>
                        </div>
                    </div>
                </div>
                <br>
                <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
                <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
            </div>
        `);
        $('#deletePost').on("click", async function () {
            await API.deletePost(post.Id);
            if (!API.error) {
                $("#abort").hide();
                $("#search").show();
                $("#createPost").show();
                $("#scrollPanel").show();
                $('#formContainer').hide();
                $("#actionTitle").text("Nouvelles");
                API.resume_Periodic_Refresh();
                pageManager.reset();
            } else {
                renderError("Une erreur est survenue!");
            }
        });
        $('#cancel').on("click", function () {
            $("#abort").hide();
            $("#search").show();
            $("#createPost").show();
            $("#scrollPanel").show();
            $('#formContainer').hide();
            $("#actionTitle").text("Nouvelles");
        });
    } else {
        renderError("Nouvelle introuvable!");
    }
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderPostForm(post = null) {
    // pause periodic refresh while editing/creating
    API.stop_Periodic_Refresh();
    $("#scrollPanel").hide();
    $("#abort").show();
    $("#search").hide();
    $("#createPost").hide();
    $("#actionTitle").text(post ? "Modification" : "Création");
    $('#formContainer').show();
    $('#formContainer').empty();
    $('#formContainer').append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post ? post.Id : 0}"/>
            
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${post ? post.Title : ''}"
            />
            <label for="Text" class="form-label">Description </label>
            <textarea 
                class="form-control"
                name="Text"
                id="Text"
                placeholder="Description"
                rows="4"
                required
                RequireMessage="Veuillez entrer une description"
            >${post ? post.Text : ''}</textarea>
            
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie"
                value="${post ? post.Category : ''}"
            />
            
            <label class="form-label">Image </label>
            <div class='imageUploader' 
                 newImage='${post ? "false" : "true"}' 
                 controlId='Image' 
                 imageSrc='${post ? post.Image : ""}' 
                 waitingImage="Loading_icon.gif">
            </div>
            
            <input type="hidden" name="Creation" value="${post ? post.Creation : Math.floor(Date.now() / 1000)}"/>
            
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);

    initImageUploaders();
    initFormValidation();

    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        post.Image = $("#Image").val();
        post = await API.savePost(post, post.Id == 0);
        if (!API.error) {
            $("#abort").hide();
            $("#search").show();
            $("#createPost").show();
            $("#scrollPanel").show();
            $('#formContainer').hide();
            $("#actionTitle").text("Nouvelles");
            API.resume_Periodic_Refresh();
            pageManager.reset();
        } else {
            renderError("Une erreur est survenue!");
        }
    });

    $('#cancel').on("click", function () {
        $("#abort").hide();
        $("#search").show();
        $("#createPost").show();
        $("#scrollPanel").show();
        $('#formContainer').hide();
        $("#actionTitle").text("Nouvelles");
        API.resume_Periodic_Refresh();
    });
}

async function updateDropDownMenu() {
    let DDMenu = $("#categoriesDD");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category"> 
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd2">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd2').on("click", function () { renderAbout(); });
    $('#allCatCmd').on("click", function () {
        selectedCategory = "";
        updateDropDownMenu();
        pageManager.reset();
    });
    $('.category').on("click", function () {
        selectedCategory = $(this).text().trim();
        updateDropDownMenu();
        pageManager.reset();
    });
}

async function compileCategories() {
    categories = [];
    let response = await API.GetQuery("?select=category&sort=category");
    if (!API.error && response && response.data) {
        let items = response.data;
        items.forEach(item => {
            if (item.Category && !categories.includes(item.Category))
                categories.push(item.Category);
        })
        updateDropDownMenu();
    }
}