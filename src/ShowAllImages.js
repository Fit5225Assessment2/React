import React from "react"
import Amplify, { API, Storage } from 'aws-amplify';
import awsconfig from './aws-exports'
import Alert from '@material-ui/lab/Alert'
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import { AmplifyAuthenticator, AmplifySignIn, AmplifySignUp, AmplifySignOut } from '@aws-amplify/ui-react';

Amplify.configure(awsconfig);

const ImageComponent = props => {
    const image = props.image
    const imageStyle = {
        width: "128px",
        height: "128px",
    }
    const [tag, setTag] = React.useState('');
    const [showAlert, setShowAlert] = React.useState('');

    const handleTagChange = (event) => {
        setTag(event.target.value)
    }

    const addTag = () => {
        const params = { 'etag': image['eTag'], 'tag': tag }
        API.put('g20fit5225api', '/g20images', { queryStringParameters: params })
            .then(response => {
                setShowAlert('Add tag' + tag + 'successfully')
            })
            .catch(error => {
                console.log(error);
            })
    }

    const deleteImageFromDB = () => {
        const params = { etag: image['eTag'] }

        API.del('g20fit5225api', '/g20images', { queryStringParameters: params })
            .then(response => {
                deleteImageFromS3()
            })
            .catch(error => {
                console.log(error);
            })
    }

    const deleteImageFromS3 = () => {
        const key = image['key']
        Storage.remove(key, { level: 'private' })
            .then(() => {
                props.onDeleteImage()
            })
            .catch(err => console.log(err))
    }


    return (
        <span>
            <div>
                <img style={{ imageStyle }} src={image['url']} />
                <label>
                    Add tag:
          <input type="text" name="tag" value={tag} onChange={handleTagChange} />
                    <button onClick={() => addTag()}>Add</button>
                </label>
                {showAlert !== '' ? <Alert onClose={() => { setShowAlert('') }}>{showAlert}</Alert> : null}
                <button onClick={() => deleteImageFromDB()}>Delete</button>
            </div>
        </span>
    )
}

const AuthStateApp = () => {
    const [authState, setAuthState] = React.useState();
    const [user, setUser] = React.useState();

    React.useEffect(() => {
        return onAuthUIStateChange((nextAuthState, authData) => {
            setAuthState(nextAuthState);
            setUser(authData)
        });
    }, []);

    React.useEffect(() => {
        if (authState == AuthState.SignedIn) {
            loadImageETag()
        }
    }, [authState])

    //load image
    const [albumProgress, setAlbumProgess] = React.useState('loading')
    const [tagStr, setTagStr] = React.useState('');
    const [eTags, setETags] = React.useState([]);
    const [images, setImages] = React.useState([]);

    const loadImageETag = async () => {
        setAlbumProgess('loading')
        const tags = tagStr.split(',')
        const tagsTmp = tags.map((each) => {
            return each.trim()
        })
        var params = {}
        tagsTmp.forEach(function (value, i) {
            params['tag' + i] = value
        });


        
        API.get('g20fit5225api', '/g20images', {queryStringParameters: params})
            .then(response => {
                setETags(response);

            })
            .catch(error => {
                console.log(error);
            })
    }

    React.useEffect(() => {
        if (authState === AuthState.SignedIn && user) {
            loadImage()
        }
    }, [eTags])

    const loadImage = () => {
        Storage.list('', { level: 'private' })
            .then(async (result) => {
                var displayImages = []
                for (const [index, image] of result.entries()) {
                    if (eTags.length > 0 && !eTags.includes(image['eTag'])) {
                        continue
                    }
                    const singedURL = await Storage.get(image['key'], { level: 'private' });
                    const tmpImage = image
                    tmpImage['url'] = singedURL
                    displayImages.push(tmpImage)
                }
                setImages(displayImages)
                setAlbumProgess('loaded')
            })
    }

    const albumContent = () => {
        switch (albumProgress) {
            case 'loading':
                return <h2>Loading Album</h2>
            case 'loaded':
                return images.map((each) => {
                    return (
                        <ImageComponent key={each['url']} image={each} onDeleteImage={loadImageETag} />
                    )
                })
        }

    }

    const searchTag = () => {
        return (
            <>
                <div>
                    Enter the search tag and split by ','
                </div>
                <div>
                    <input type="text" value={tagStr} onChange={e => setTagStr(e.target.value)} />
                </div>
                <div>
                    current search tag: {tagStr}
                </div>
                <div>
                    <button onClick={loadImageETag}>search</button>
                </div>
            </>
        )
    }

    // upload image
    const [uploadProgress, setUploadProgress] = React.useState('getUpload');
    const [uploadImage, setUploadImage] = React.useState();
    const [errorMessage, setErrorMessage] = React.useState();
    const upload = async () => {
        try {
            setUploadProgress('uploading')
            await Storage.put(`${user.username + Date.now()}.jpeg`, uploadImage, { level:'private', contentType: 'image/jpeg' });
            setUploadProgress('uploadFinish')
        } catch (error) {
            console.log('Something wrong', error);
            setErrorMessage(error.message)
            setUploadProgress('uploadError')
        }
    }
    const uploadContent = () => {
        switch (uploadProgress) {
            case 'getUpload':
                return (
                    <>
                        <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
                        <button onClick={upload}>Upload</button>
                    </>
                )
            case 'uploading':
                return <h2>Uploading</h2>
            case 'uploadFinish':
                return (
                    <>
                        <div>
                            upload successfully!!
              </div>
                        <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
                        <button onClick={upload}>Upload</button>
                    </>
                )
            case 'Error':
                return (
                    <>
                        <div>
                            Error message = {errorMessage}
                        </div>
                        <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
                        <button onClick={upload}>Upload</button>
                    </>
                )

            default:
                break;
        }
    }

    React.useEffect(() => {
        if (uploadProgress == 'uploaded') {
            loadImageETag()
        }

    }, [uploadProgress])

    return authState === AuthState.SignedIn && user ? (
        <div className="App">
                <header className="App-header">
                    <div>
                        {searchTag()}
                    </div>
                    <div>
                        {albumContent()}
                    </div>
                </header>       
        </div>
    ) : (
            <AmplifyAuthenticator>
                <AmplifySignUp
                    slot="sign-up"
                    formFields={[
                        {
                            type: "username",
                            placeholder: "Your email address"
                        },
                        {
                            type: "password",
                            placeholder: "At least 8 characteristic"
                        },

                        {
                            type: "given_name",
                            label: "Given Name",
                            placeholder: "Enter your given name",
                            required: true,
                        },

                        {
                            type: "family_name",
                            label: "Family name",
                            placeholder: "Enter your family name",
                            required: true,
                        }
                    ]}
                />
                <AmplifySignIn slot="sign-in" usernameAlias="email" />
            </AmplifyAuthenticator>
        );
}



export default AuthStateApp;
