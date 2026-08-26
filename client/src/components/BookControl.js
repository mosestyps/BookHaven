import React, { Component } from 'react';
import axios from 'axios';
import BookList from './BookList';
import NewBookForm from './NewBookForm';
import BookDetail from './BookDetail';
import AddBook from './AddBook';
import EditBookForm from './EditBookForm';

// Backend API URL explicitly pointing to your GKE backend service IP
const API_BASE_URL = 'http://35.222.168.44:5000';

class BookControl extends Component {

    constructor(props) {
        super(props);
        this.state = {
            formVisibleOnPage: false,
            actualBookList: [],
            selectedBook: null,
            editBook: false,
        };
    }

    componentDidMount() {
        axios.get(`${API_BASE_URL}/api/books`)
            .then(res => {
                this.setState({
                    actualBookList: res.data
                });
            })
            .catch(error => {
                console.error("Error fetching books:", error);
            });
    }

    handleEditBookClick = () => {
        this.setState({
            editBook: true
        });
    }

    handleBorrowButtonClick = (id) => {
        const borrowedBook = this.state.actualBookList.filter(book => book._id === id)[0];
        borrowedBook.copies = borrowedBook.copies - 1;
        if (borrowedBook.copies <= 0) {
            borrowedBook.copies = "No copies available";
        }
        this.setState({
            selectedBook: borrowedBook
        });
    }

    handleClick = () => {
        if (this.state.editBook) {
            this.setState({
                editBook: false
            });
        } else if (this.state.selectedBook != null) {
            this.setState({
                formVisibleOnPage: false,
                selectedBook: null
            });
        } else {
            this.setState(prevState => ({
                formVisibleOnPage: !prevState.formVisibleOnPage
            }));
        }
    }

    // Method to handle adding a new book with instant state update (no reload needed!)
    handleAddingNewBook = (newBook) => {
        axios.post(`${API_BASE_URL}/api/books`, newBook)
            .then(res => {
                this.setState({
                    actualBookList: [...this.state.actualBookList, res.data],
                    formVisibleOnPage: false
                });
            })
            .catch(error => {
                console.error("Failed to add book:", error);
            });
    };

    handleDeletingBook = (id) => {
        axios.delete(`${API_BASE_URL}/api/books/` + id)
            .then(res => console.log(res.data))
            .catch((error) => {
                console.log(error);
            });
        this.setState({
            actualBookList: this.state.actualBookList.filter(book => book._id !== id),
            formVisibleOnPage: false,
            selectedBook: null
        });
    }

    handleChangingSelectedBook = (id) => {
        const selectedBook = this.state.actualBookList.filter(book => book._id === id)[0];
        this.setState({ selectedBook: selectedBook });
    }

    handleEditingBook = (editedBook) => {
        axios.put(`${API_BASE_URL}/api/books/` + this.state.selectedBook._id, editedBook)
            .then(res => console.log(res.data))
            .catch(error => console.error("Error editing book:", error));

        this.setState({
            editBook: false,
            formVisibleOnPage: false
        });
        window.location = '/';
    }

    render() {
        let currentlyVisibleState = null;
        let buttonText = null;
        if (this.state.editBook) {
            currentlyVisibleState = <EditBookForm book={this.state.selectedBook} onEditBook={this.handleEditingBook} />;
            buttonText = "Back to book detail";
        } else if (this.state.selectedBook != null) {
            currentlyVisibleState = <BookDetail book={this.state.selectedBook} onBorrowButtonClick={this.handleBorrowButtonClick} onDeleteBook={this.handleDeletingBook} onEditBookClick={this.handleEditBookClick} />;
            buttonText = "Back to catalog";
        } else if (this.state.formVisibleOnPage) {
            currentlyVisibleState = <NewBookForm onNewBookCreation={this.handleAddingNewBook} />;
            buttonText = "Back to catalog";
        } else {
            currentlyVisibleState = <BookList bookList={this.state.actualBookList} onBookSelection={this.handleChangingSelectedBook} />;
            buttonText = "Add a book";
        }
        return (
            <React.Fragment>
                <AddBook
                    buttonText={buttonText}
                    whenButtonClicked={this.handleClick}
                />
                {currentlyVisibleState}
            </React.Fragment>
        );
    }
}

export default BookControl;