import React, { useCallback, useState, forwardRef, useImperativeHandle } from "react"

import "../assets/style/index.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCropSimple, faDownload, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Draggable } from "react-drag-reorder";
import Crop from "./crop";

const ERROR = {
  NOT_SUPPORTED_EXTENSION: 'NOT_SUPPORTED_EXTENSION',
  FILESIZE_TOO_LARGE: 'FILESIZE_TOO_LARGE'
}

const UploadPictures = forwardRef((
  {
    title = "upload pictures",
    imgExtension = ['.jpg', '.jpeg', '.gif', '.png'],
    maxFileSize = 5242880,
    height = "200px",
    width = "200px",
    sizModal = "modal-xl",
    iconSize = "lg",
    drag = false,
    crop = false,
    savePictures,
    multiple = true,
    aspect = 4 / 3,
    errorsMessages = {
      NOT_SUPPORTED_EXTENSION: 'not supported extension',
      FILESIZE_TOO_LARGE: 'file size too large'
    }
  },
  ref
) => {

  useImperativeHandle(ref, () => ({
    openModal(status) {
      setOpen(status)
    }
  }));
  const [open, setOpen] = useState(false)
  const [pictures, setPictures] = useState([])
  const [errors, setErrors] = useState([])
  const [srcCrop, setSrcCrop] = useState(false)
  const [openCrop, setOpenCrop] = useState(false)
  const [indexCrop, setIndexCrop] = useState(false)

  const hasExtension = (fileName) => {
    const pattern = '(' + imgExtension.join('|').replace(/\./g, '\\.') + ')$';
    return new RegExp(pattern, 'i').test(fileName);
  }

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        let dataURL = e.target.result;
        dataURL = dataURL.replace(";base64", `;name=${file.name};base64`);
        resolve({ file, dataURL });
      };

      reader.readAsDataURL(file);
    });
  }

  const onFileChange = event => {
    setErrors([]);
    let allFilePromises = []
    let fileError = [];
    let fileErrors = [];
    if (event.target.files) {
      Array.from(event.target.files).map((file) => {
        if (!hasExtension(file.name)) {
          fileError = Object.assign(fileError, {
            type: ERROR.NOT_SUPPORTED_EXTENSION
          });
          fileErrors.push(fileError);
        }

        if (file.size > maxFileSize) {
          fileError = Object.assign(fileError, {
            type: ERROR.FILESIZE_TOO_LARGE
          });
          fileErrors.push(fileError);
        }
        if (fileErrors.length > 0) {
          setErrors(fileErrors);
          return false
        }
        allFilePromises.push(readFile(file));
      })
      if (fileErrors.length === 0) {
        Promise.all(allFilePromises).then(newFilesData => {
          let files = []
          newFilesData.forEach(newFileData => {
            newFileData.file.src = newFileData.dataURL
            files.push(newFileData.file);
          });
          setPictures(files);
        });
      }
    }
  };

  const remove = (index) => {
    let newList = pictures.filter((_, i) => i !== index);
    setPictures(newList);
  }

  const getChangedPos = (currentPos, newPos) => {
    let index = [];
    let newList = pictures
    let pic = newList.splice(currentPos, 1);
    newList.splice(newPos - 1, 0, pic[0])
    setPictures(newList)
  };

  const DraggableRender = useCallback(() => {

    return (
      <Draggable onPosChange={getChangedPos}>
        {
          pictures && pictures.map((picture, index) => (
            <div className="postion-relative p-0 mx-2" key={index} style={{ width: width }}>
              <Actions index={index} iconSize={iconSize} remove={remove} cropPicture={cropPicture} crop={crop} />
              <Image picture={picture} height={height} width={width} className="mb-4" />
            </div>
          ))
        }
      </Draggable>
    );
  }, [pictures]);


  const ImagesRender = useCallback(() => {

    return (
      <div className="row d-flex justify-content-center">
        {
          pictures && pictures.map((picture, index) => (
            <div className="postion-relative p-0 mx-2" key={index} style={{ width: width }}>
              <Actions index={index} iconSize={iconSize} remove={remove} cropPicture={cropPicture} crop={crop} />
              <Image picture={picture} height={height} width={width} className="mb-4" />
            </div>
          ))
        }
      </div>
    );
  }, [pictures]);


  const cropPicture = (index) => {
    let picture = pictures.find((_, i) => i === index);
    setSrcCrop(picture)
    setOpenCrop(true)
    setIndexCrop(index)
  }

  const saveCropedPicture = (picture) => {
    setPictures(items => items.map((item, i) =>
      i === indexCrop
        ? picture
        : item
    ));
    setSrcCrop(false)
    setOpenCrop(false)
    setIndexCrop(false)
  }

  const sendPictures = () => {
    savePictures(pictures);
    setPictures(false)
    setOpen(false)

  }
  return (
    <div ref={ref}>
      {
        crop && <Crop picture={srcCrop} isOpen={openCrop} setOpenCrop={setOpenCrop} saveCropedPicture={saveCropedPicture} iconSize={iconSize} aspect={aspect} />
      }

      {
        open &&
        (
          <div className={"modal modal-dialog modal-dialog-centered modal-dialog-scrollable fade " + sizModal + (open ? " show" : "")} tabIndex="-1" id="exampleModal">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="exampleModalLabel">{title}</h1>
                  <button type="button" className="btn-close" onClick={() => { setOpen(false); setPictures([]); }}></button>
                </div>
                <div className="modal-body">
                  {
                    errors.length > 0 && (
                      <div>
                        {
                          errors.map((error, key) => (
                            <div className="alert alert-warning" key={key} role="alert">
                              {errorsMessages[error.type]}
                            </div>
                          ))
                        }
                      </div>
                    )
                  }
                  <div className="row justify-content-center mb-5">
                    <div className="mb-3" style={{ width: "300px" }}>
                      <input onChange={onFileChange} className="form-control" type="file" id="formFile" multiple={multiple} />
                    </div>
                  </div>
                  <div className="row d-flex justify-content-center">
                    {
                      drag && pictures.length > 0 ? (
                        <DraggableRender />
                      ) : (
                        <ImagesRender />
                      )
                    }
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => { setOpen(false); setPictures([]); setErrors([]); }} className="btn btn-secondary">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                  <button type="button" className="btn btn-primary" onClick={sendPictures}>
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                </div>
              </div>
            </div>
            {
              crop && <div className={(openCrop ? "modal-backdrop fade show" : "")}></div>
            }
          </div>
        )
      }
      <div className={(open ? "modal-backdrop fade show" : "")}></div>
    </div>
  )
})


function Image({ picture, width, height }) {
  return <img src={picture.src} style={{
    height: height,
    width: width,
  }} className="mb-4" />
}


function Actions({
  index,
  iconSize,
  remove,
  cropPicture,
  crop
}) {
  return (
    <div className="d-flex w-100 justify-content-between p-0 pb-3" >
      {
        crop && <FontAwesomeIcon role="button" onClick={() => cropPicture(index)} icon={faCropSimple} size={iconSize} />
      }
      <FontAwesomeIcon role="button" onClick={() => remove(index)} icon={faXmark} size={iconSize} />
    </div>
  )
}
export default UploadPictures;