document.addEventListener("DOMContentLoaded", () => {
    const apiUrl = "http://127.0.0.1:5057";
    const authContent = document.getElementById('auth-content');
    const formContent = document.getElementById('form-content');
    const bookContent = document.getElementById('book-content');
    const userProfile = document.getElementById('user-profile');
    let accessToken = null;
    let currentUserRole = null;

    // Function to fetch books
    const fetchBooks = (isQuickView = false) => {
        axios.get(`${apiUrl}/books`)
            .then(response => {
                displayBooks(response.data, isQuickView, currentUserRole === 'admin');
            })
            .catch(error => {
                console.error('There was an error fetching the books!', error);
            });
    };

    // Function to display books
    const displayBooks = (books, isQuickView = false, isAdmin = false) => {
        bookContent.innerHTML = ''; // Clear the content
    
        const closeButton = document.createElement('button');
        closeButton.className = 'btn btn-secondary mb-3';
        closeButton.textContent = 'Close Book List';
        closeButton.id = 'close-book-list';
        bookContent.appendChild(closeButton);
    
        books.forEach(book => {
            let loanPeriod;
            switch(book.type) {
                case 1: loanPeriod = "up to 10 days"; break;
                case 2: loanPeriod = "up to 5 days"; break;
                case 3: loanPeriod = "up to 2 days"; break;
                default: loanPeriod = "unknown";
            }
    
            const bookCard = `
                <div class="card mb-3">
                    <div class="row no-gutters">
                        <div class="col-md-4">
                            <img src="${book.image_url}" class="card-img" alt="${book.title}" style="width: 150px; height: auto;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${book.title}</h5>
                                <p class="card-text">Author: ${book.author}</p>
                                <p class="card-text"><small class="text-muted">Published: ${book.published_year}</small></p>
                                <p class="card-text">Type: ${book.type} (can be loaned ${loanPeriod})</p>
                                <p class="card-text">Available: ${book.available ? 'Yes' : 'No'}</p>
                                <p class="card-text">Active: ${book.is_active ? 'Yes' : 'No'}</p>
                                ${!isQuickView ? `    
                                    ${book.available && !isAdmin ? 
                                        `<button class="btn btn-primary loan-book-btn" data-id="${book.id}">Loan</button>` : 
                                        (book.available ? '' : '<p class="text-danger">Not available for loan</p>')
                                    }
                                    ${isAdmin ? `
                                        <button class="btn btn-secondary update-book-btn" data-id="${book.id}">Update</button>
                                        ${book.is_active ? 
                                            `<button class="btn btn-danger remove-book-btn" data-id="${book.id}">Remove</button>` : 
                                            `<button class="btn btn-success activate-book-btn" data-id="${book.id}">Activate</button>`
                                        }
                                    ` : ''}
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            bookContent.innerHTML += bookCard;
        });
    
        // Add event listener for close button
        document.getElementById('close-book-list').addEventListener('click', () => {
            bookContent.innerHTML = ''; // Clear the book list
        });
    
        if (!isQuickView) {
            document.querySelectorAll('.loan-book-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const bookId = event.target.getAttribute('data-id');
                    loanBook(bookId);
                });
            });

            if (isAdmin) {
                document.querySelectorAll('.update-book-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const bookId = event.target.getAttribute('data-id');
                        showUpdateBookForm(bookId);
                    });
                });
                document.querySelectorAll('.remove-book-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const bookId = event.target.getAttribute('data-id');
                        if (confirm('Are you sure you want to remove this book?')) {
                            updateBookStatus(bookId, false);
                        }
                    });
                });
                document.querySelectorAll('.activate-book-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const bookId = event.target.getAttribute('data-id');
                        if (confirm('Are you sure you want to activate this book?')) {
                            updateBookStatus(bookId, true);
                        }
                    });
                });
            }
        }
    };


    // Function for admin to manage all books
    const manageAllBooks = () => {
        axios.get(`${apiUrl}/books`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            displayBooks(response.data, false, true);
        })
        .catch(error => {
            console.error('There was an error fetching the books!', error);
        });
    };


    const updateBookStatus = (bookId, isActive) => {
        axios.put(`${apiUrl}/book-status/${bookId}`, { is_active: isActive }, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            alert(response.data.message);
            fetchBooks(); // Refresh the book list
        })
        .catch(error => {
            console.error(`There was an error updating the book status!`, error);
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                alert('An error occurred while updating the book status');
            }
        });
    };

    // Show update book form
    const showUpdateBookForm = (bookId) => {
        axios.get(`${apiUrl}/books`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            const book = response.data.find(b => b.id === parseInt(bookId));
            if (!book) {
                throw new Error('Book not found');
            }
            formContent.style.display = 'block';
            formContent.innerHTML = `
                <h3>Update Book</h3>
                <form id="update-book-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="update-book-title">Title</label>
                        <input type="text" id="update-book-title" class="form-control" value="${book.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="update-book-author">Author</label>
                        <input type="text" id="update-book-author" class="form-control" value="${book.author}" required>
                    </div>
                    <div class="form-group">
                        <label for="update-published-year">Published Year</label>
                        <input type="number" id="update-published-year" class="form-control" value="${book.published_year}">
                    </div>
                    <div class="form-group">
                        <label for="update-book-type">Type</label>
                        <input type="number" id="update-book-type" class="form-control" value="${book.type}" required>
                    </div>
                    <div class="form-group">
                        <label for="update-book-image">Image</label>
                        <input type="file" id="update-book-image" class="form-control">
                    </div>
                    <button type="submit" class="btn btn-primary">Update Book</button>
                    <button type="button" class="btn btn-secondary" id="cancel-update">Cancel</button>
                </form>
            `;
    
            document.getElementById('update-book-form').addEventListener('submit', (event) => {
                event.preventDefault();
                handleUpdateBook(bookId);
            });
    
            document.getElementById('cancel-update').addEventListener('click', () => {
                formContent.style.display = 'none';
            });
        })
        .catch(error => {
            console.error('There was an error fetching the book details!', error);
            alert('Error fetching book details. Please try again.');
        });
    };

    // Handle update book form submission
    const handleUpdateBook = (bookId) => {
        const formData = new FormData();
        formData.append('title', document.getElementById('update-book-title').value);
        formData.append('author', document.getElementById('update-book-author').value);
        formData.append('published_year', document.getElementById('update-published-year').value);
        formData.append('type', document.getElementById('update-book-type').value);
        const fileInput = document.getElementById('update-book-image');
        if (fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        }
    
        axios.put(`${apiUrl}/update-book/${bookId}`, formData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(response => {
            alert('Book updated successfully!');
            formContent.style.display = 'none'; 
            fetchBooks();
        })
        .catch(error => {
            console.error('There was an error updating the book!', error);
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                alert('An error occurred while updating the book. Please try again.');
            }
        });
    };

    // Function to loan a book
    const loanBook = (bookId) => {
        axios.post(`${apiUrl}/loan-book`, { book_id: bookId }, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            alert('Book loaned successfully!');
            fetchBooks(); // Refresh the book list
        })
        .catch(error => {
            console.error('There was an error loaning the book!', error);
        });
    };

    // Function to fetch users for admin
    const fetchUsersForAdmin = () => {
        axios.get(`${apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            displayUsersForAdmin(response.data);
        })
        .catch(error => {
            console.error('There was an error fetching the users!', error);
        });
    };

// Function to display users for admin
const displayUsersForAdmin = (users) => {
    userProfile.innerHTML = ''; // Clear the content

    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary mb-3';
    closeButton.textContent = 'Close';
    closeButton.id = 'close-users-panel';
    userProfile.appendChild(closeButton);

    users.forEach(user => {
        const userCard = `
            <div class="card mb-3 ${user.is_active ? '' : 'bg-light'}">
                <div class="row no-gutters">
                    <div class="col-md-4">
                        <img src="${user.profile_photo}" class="card-img" alt="${user.username}" style="width: 150px; height: 200px; object-fit: cover; border-radius: 50%;">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${user.username}</h5>
                            <p class="card-text">Role: ${user.role}</p>
                            <p class="card-text">City: ${user.city}</p>
                            <p class="card-text">Email: ${user.email}</p>
                            <p class="card-text">Status: ${user.is_active ? 'Active' : 'Inactive'}</p>
                            <button class="btn btn-secondary update-user-btn" data-id="${user.id}">Update</button>
                            ${user.is_active ? 
                                `<button class="btn btn-danger remove-user-btn" data-id="${user.id}">Remove</button>` :
                                `<button class="btn btn-success activate-user-btn" data-id="${user.id}">Activate</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        userProfile.innerHTML += userCard;
    });

    // Event delegation remains the same
    userProfile.addEventListener('click', (event) => {
        if (event.target.classList.contains('update-user-btn')) {
            const userId = event.target.getAttribute('data-id');
            showUpdateUserForm(userId);
        } else if (event.target.classList.contains('remove-user-btn')) {
            const userId = event.target.getAttribute('data-id');
            removeUser(userId);
        } else if (event.target.classList.contains('activate-user-btn')) {
            const userId = event.target.getAttribute('data-id');
            activateUser(userId);
        } else if (event.target.id === 'close-users-panel') {
            getUserProfile();
        }
    });
};
    
    
    // Show update user form
    const showUpdateUserForm = (userId) => {
        formContent.style.display = 'block';
        axios.get(`${apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            const users = response.data;
            const user = users.find(u => u.id === parseInt(userId));
            if (!user) {
                throw new Error('User not found');
            }
            formContent.innerHTML = `
                <h3>Update User</h3>
                <form id="update-user-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="update-username">Username</label>
                        <input type="text" id="update-username" class="form-control" value="${user.username}" required>
                    </div>
                    <div class="form-group">
                        <label for="update-email">Email</label>
                        <input type="email" id="update-email" class="form-control" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="update-city">City</label>
                        <input type="text" id="update-city" class="form-control" value="${user.city}">
                    </div>
                    <div class="form-group">
                        <label for="update-role">Role</label>
                        <input type="text" id="update-role" class="form-control" value="${user.role}" required>
                    </div>
                    <div class="form-group">
                        <label for="update-password">Password</label>
                        <input type="password" id="update-password" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="update-profile-photo">Profile Photo</label>
                        <input type="file" id="update-profile-photo" class="form-control">
                    </div>
                    <button type="submit" class="btn btn-primary">Update User</button>
                    <button type="button" class="btn btn-secondary" id="cancel-update">Cancel</button>
                </form>
            `;
        
            document.getElementById('update-user-form').addEventListener('submit', (event) => {
                event.preventDefault();
                handleUpdateUser(userId);
            });
    
            document.getElementById('cancel-update').addEventListener('click', () => {
                formContent.style.display = 'none';
            });
        })
        .catch(error => {
            console.error('There was an error fetching the user details!', error);
        });
    };
    
    const handleUpdateUser = (userId) => {
        const formData = new FormData();
        formData.append('username', document.getElementById('update-username').value);
        formData.append('email', document.getElementById('update-email').value);
        formData.append('city', document.getElementById('update-city').value);
        formData.append('role', document.getElementById('update-role').value);
    
        const password = document.getElementById('update-password').value;
        if (password) {
            formData.append('password', password);
        }
    
        const fileInput = document.getElementById('update-profile-photo');
        if (fileInput.files.length > 0) {
            formData.append('profile_photo', fileInput.files[0]);
        }
    
        axios.put(`${apiUrl}/update-user/${userId}`, formData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(response => {
            alert('User updated successfully!');
            formContent.style.display = 'none'; 
            fetchUsersForAdmin(); 
        })
        .catch(error => {
            console.error('There was an error updating the user!', error);
            alert('Error updating user. Please try again.');
        });
    };

    const removeUser = (userId) => {
        axios.put(`${apiUrl}/remove-user/${userId}`, {}, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            alert('User removed successfully');
            fetchUsersForAdmin(); 
        })
        .catch(error => {
            if (error.response && error.response.status === 400) {
                alert(error.response.data.error);
            } else {
                console.error('Error removing user:', error);
                alert('Error removing user');
            }
        });
    };
    
    const activateUser = (userId) => {
        axios.put(`${apiUrl}/activate/user/${userId}`, {}, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            alert('User activated successfully');
            fetchUsersForAdmin();
        })
        .catch(error => {
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                console.error('Error activating user:', error);
                alert('Error activating user');
            }
        });
    };


    // Function to fetch users
    const fetchUsers = () => {
        axios.get(`${apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            displayUsersInModal(response.data);
        })
        .catch(error => {
            console.error('There was an error fetching the users!', error);
        });
    };

    // Function to display users in modal
    const displayUsersInModal = (users) => {
        const modal = document.getElementById('userModal');
        const modalBody = document.getElementById('user-modal-body');
        const closeButton = document.querySelector('.close');

        modalBody.innerHTML = ''; // Clear the content

        users.forEach(user => {
            const userCard = `
                <div class="card mb-3">
                    <div class="row no-gutters">
                        <div class="col-md-4">
                            <img src="${user.profile_photo}" class="card-img" alt="${user.username}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${user.username}</h5>
                                <p class="card-text">${user.city}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            modalBody.innerHTML += userCard;
        });

        modal.style.display = 'block';

        // Close the modal when the user clicks on <span> (x)
        closeButton.onclick = function() {
            modal.style.display = 'none';
        }

        // Close the modal when the user clicks anywhere outside of the modal
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    };


    // Function to display loans
    const displayLoans = (loans) => {
        bookContent.innerHTML = ''; // Clear the content
        loans.forEach(loan => {
            const loanCard = `
                <div class="card mb-3">
                    <div class="row no-gutters">
                        <div class="col-md-4">
                            <img src="${loan.book.image_url}" class="card-img" alt="${loan.book.title}" style="width: 150px; height: auto;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${loan.book.title}</h5>
                                <p class="card-text">User: ${loan.user.username}</p>
                                <p class="card-text">Book Type: ${loan.book.type} (${loan.book.loan_period})</p>
                                <p class="card-text">Loaned on: ${loan.loan_date}</p>
                                ${loan.return_date ? 
                                    `<p class="card-text">Returned on: ${loan.return_date}</p>` : 
                                    `<p class="card-text text-warning">Not returned yet</p>`
                                }
                                ${currentUserRole !== 'admin' && !loan.return_date ? 
                                    `<button class="btn btn-primary return-book-btn" data-id="${loan.book.id}">Return Book</button>` : 
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
            bookContent.innerHTML += loanCard;
        });

        // Add event listeners for return buttons if user is not admin
        if (currentUserRole !== 'admin') {
            document.querySelectorAll('.return-book-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const bookId = event.target.getAttribute('data-id');
                    returnBook(bookId);
                });
            });
        }
    };

    // Function to display late loans
    const displayLateLoans = (loans) => {
        bookContent.innerHTML = ''; // Clear the content

        loans.forEach(loan => {
            const loanCard = `
                <div class="card mb-3" style="border: 2px solid red;">
                    <div class="row no-gutters">
                        <div class="col-md-4">
                            <img src="${loan.book.image_url}" class="card-img" alt="${loan.book.title}" style="width: 150px; height: auto;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${loan.book.title}</h5>
                                <p class="card-text">User: ${loan.user.username}</p>
                                <p class="card-text">Book Type: ${loan.book.type} (${loan.book.loan_period})</p>
                                <p class="card-text">Loaned on: ${loan.loan_date}</p>
                                <p class="card-text text-danger">Days overdue: ${loan.days_overdue}</p>
                                ${currentUserRole !== 'admin' ? 
                                    `<button class="btn btn-primary return-book-btn" data-id="${loan.book.id}">Return Book</button>` : 
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
            bookContent.innerHTML += loanCard;
        });

        // Add event listeners for return buttons if user is not admin
        if (currentUserRole !== 'admin') {
            document.querySelectorAll('.return-book-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const bookId = event.target.getAttribute('data-id');
                    returnBook(bookId);
                });
            });
        }
    };

    // Function to return a book
    const returnBook = (bookId) => {
        axios.post(`${apiUrl}/return-book`, { book_id: bookId }, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            alert('Book returned successfully!');
            fetchLoans(); // Refresh the loan list
        })
        .catch(error => {
            console.error('There was an error returning the book!', error);
        });
    };

    
    // Function to fetch loans
    const fetchLoans = () => {
        axios.get(`${apiUrl}/loans`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            displayLoans(response.data);
        })
        .catch(error => {
            console.error('There was an error fetching the loans!', error);
        });
    };

    // Function to fetch late loans
    const fetchLateLoans = () => {
        axios.get(`${apiUrl}/late-loans`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            displayLateLoans(response.data);
        })
        .catch(error => {
            console.error('There was an error fetching the late loans!', error);
        });
    };

    // Show login form
    const showLoginForm = () => {
        formContent.innerHTML = `
            <h3>Login</h3>
            <form id="login-form">
                <div class="form-group">
                    <label for="login-username">Username</label>
                    <input type="text" id="login-username" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
        `;
        document.getElementById('login-form').addEventListener('submit', handleLogin);
    };

    // Handle login form submission
    const handleLogin = (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        axios.post(`${apiUrl}/login`, { username, password })
            .then(response => {
                alert('Login successful!');
                accessToken = response.data.access_token;
                authContent.style.display = 'none';
                formContent.style.display = 'none';
                getUserProfile();
            })
            .catch(error => {
                console.error('There was an error logging in!', error);
            });
            bookContent.innerHTML = '';
    };

    // Show register form
    const showRegisterForm = () => {
        formContent.innerHTML = `
            <h3>Register</h3>
            <form id="register-form" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="register-username">Username</label>
                    <input type="text" id="register-username" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input type="password" id="register-password" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-email">Email</label>
                    <input type="email" id="register-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-city">City</label>
                    <input type="text" id="register-city" class="form-control">
                </div>
                <div class="form-group">
                    <label for="profile-photo">Profile Photo</label>
                    <input type="file" id="profile-photo" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-secondary">Register</button>
            </form>
        `;
        document.getElementById('register-form').addEventListener('submit', handleRegister);
    };

    // Handle register form submission
    const handleRegister = (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('username', document.getElementById('register-username').value);
        formData.append('password', document.getElementById('register-password').value);
        formData.append('email', document.getElementById('register-email').value);
        formData.append('city', document.getElementById('register-city').value);
        formData.append('profile_photo', document.getElementById('profile-photo').files[0]);

        axios.post(`${apiUrl}/register`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(response => {
            alert('Registration successful!');
            showLoginForm();
        })
        .catch(error => {
            console.error('There was an error registering!', error);
        });
        bookContent.innerHTML = '';
    };

    // Get user profile
    const getUserProfile = () => {
        axios.get(`${apiUrl}/my-profile`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
            currentUserRole = response.data.role; 
            console.log("Current user role:", currentUserRole);
            displayUserProfile(response.data);
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            alert('Error fetching user profile');
        });
    };

    // Function to display user profile
    const displayUserProfile = (user) => {
        currentUserRole = user.role;
        formContent.innerHTML = ''; // Clear any forms
        userProfile.innerHTML = `
            <div class="card mb-3">
                <div class="row no-gutters">
                    <div class="col-md-4">
                        <img src="${user.profile_photo}" class="card-img" alt="${user.username}" id="user-profile-img" style="width: 150px; height: auto;">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${user.username}</h5>
                            <p class="card-text">${user.email}</p>
                            <p class="card-text">${user.city}</p>
                            <p class="card-text"><small class="text-muted">${user.role}</small></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        userProfile.style.display = 'block';

        // Add role-specific buttons and actions
        if (currentUserRole === 'admin') {
            // Add admin-specific actions
            userProfile.innerHTML += `
                <button id="add-book-btn" class="btn btn-primary">Add Book</button>
                <button id="manage-all-books-btn" class="btn btn-primary mt-3">Manage All Books</button>
                <button id="manage-users-btn" class="btn btn-primary">Manage Users</button>
                <button id="view-all-loans-btn" class="btn btn-secondary mt-3">View All Loans</button>
                <button id="view-all-late-loans-btn" class="btn btn-danger mt-3">View All Late Loans</button>
                <button id="logout-btn" class="btn btn-dark mt-3">Log Out</button>
            `;
             // Add event listeners for admin buttons
            document.getElementById('add-book-btn').addEventListener('click', () => {
                showAddBookForm();
            });
            document.getElementById('add-book-btn').addEventListener('click', showAddBookForm);
            document.getElementById('manage-all-books-btn').addEventListener('click', manageAllBooks);
            document.getElementById('manage-users-btn').addEventListener('click', fetchUsersForAdmin);
            document.getElementById('view-all-loans-btn').addEventListener('click', fetchLoans);
            document.getElementById('view-all-late-loans-btn').addEventListener('click', fetchLateLoans);
            document.getElementById('logout-btn').addEventListener('click', () => {
                accessToken = null;
                authContent.style.display = 'block';
                formContent.style.display = 'none';
                userProfile.style.display = 'none';
                bookContent.innerHTML = '';
                window.location.reload(); // Reload the page to reset the state
            });
        } else {
            // Add user-specific actions
            userProfile.innerHTML += `
                <div class="mt-4">
                    <div class="input-group mb-3">
                        <input type="text" id="search-book" class="form-control" placeholder="Search book by name">
                        <div class="input-group-append">
                            <button id="search-book-btn" class="btn btn-primary">Search</button>
                        </div>
                    </div>
                    <button id="show-books-btn" class="btn btn-info">Show All Books</button>
                    <button id="view-loans-btn" class="btn btn-secondary mt-3">View Loans</button>
                    <button id="view-late-loans-btn" class="btn btn-danger mt-3">View Late Loans</button>
                    <button id="show-users-btn" class="btn btn-success mt-3">Show Users</button>
                    <button id="logout-btn" class="btn btn-dark mt-3">Log Out</button>
                </div>
            `;

            document.getElementById('search-book-btn').addEventListener('click', () => {
                const bookName = document.getElementById('search-book').value;
                findBooks(bookName);
            });

            document.getElementById('show-books-btn').addEventListener('click', () => fetchBooks(false));
            document.getElementById('view-loans-btn').addEventListener('click', fetchLoans);
            document.getElementById('view-late-loans-btn').addEventListener('click', fetchLateLoans);
            document.getElementById('show-users-btn').addEventListener('click', fetchUsers);
            document.getElementById('logout-btn').addEventListener('click', () => {
                accessToken = null;
                authContent.style.display = 'block';
                formContent.style.display = 'none';
                userProfile.style.display = 'none';
                bookContent.innerHTML = '';
                window.location.reload(); // Reload the page to reset the state
            });
        }
    };
    
// Show add book form
const showAddBookForm = () => {
    formContent.style.display = 'block';
    formContent.style.zIndex = '1000';
    formContent.innerHTML = `
        <h3>Add New Book</h3>
        <form id="add-book-form" enctype="multipart/form-data">
            <div class="form-group">
                <label for="book-title">Title</label>
                <input type="text" id="book-title" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="book-author">Author</label>
                <input type="text" id="book-author" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="published-year">Published Year</label>
                <input type="number" id="published-year" class="form-control">
            </div>
            <div class="form-group">
                <label for="book-type">Type</label>
                <input type="number" id="book-type" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="book-image">Image</label>
                <input type="file" id="book-image" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary">Add Book</button>
            <button type="button" class="btn btn-secondary" id="cancel-add-book">Cancel</button>
        </form>
    `;

    document.getElementById('add-book-form').addEventListener('submit', handleAddBook);
    document.getElementById('cancel-add-book').addEventListener('click', () => {
        formContent.style.display = 'none';
    });
};

// Handle add book form submission
const handleAddBook = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('book-title').value);
    formData.append('author', document.getElementById('book-author').value);
    formData.append('published_year', document.getElementById('published-year').value);
    formData.append('type', document.getElementById('book-type').value);
    formData.append('image', document.getElementById('book-image').files[0]);

    axios.post(`${apiUrl}/add-book`, formData, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(response => {
        alert('Book added successfully!');
        formContent.style.display = 'none'; // Скрываем форму после успешного добавления
        fetchBooks(); // Обновляем список книг
    })
    .catch(error => {
        console.error('There was an error adding the book!', error);
        alert('Error adding book. Please try again.');
    });
};
    document.getElementById('login-btn').addEventListener('click', showLoginForm);
    document.getElementById('register-btn').addEventListener('click', showRegisterForm);
    document.getElementById('view-books-btn').addEventListener('click', () => fetchBooks(true));
});
