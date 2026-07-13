function CheckIcon() {
  return (
    <svg className="mr-3 shrink-0" width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="m1 4 3 3 6-6" stroke="#1EB16D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className="mr-2 shrink-0" width="10" height="10" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12 11.667 1m0 11L1 1" stroke="#FE3D54" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CartProgressBar() {
  return (
    <div className="w-2/3 md:w-full mx-auto">
      <div className="flex -mx-1 relative">
        <div className="w-1/3 px-1 text-blue text-center font-bold">
          <div className="pb-2">
            <span className="absolute md:static left-0 right-0 top-0">Basket</span>
          </div>
          <div className="h-1 bg-blue rounded" />
        </div>
        <div className="w-1/3 px-1">
          <div className="pb-2">&nbsp;</div>
          <div className="h-0.5 my-px bg-grey rounded" />
        </div>
        <div className="w-1/3 px-1">
          <div className="pb-2">&nbsp;</div>
          <div className="h-0.5 my-px bg-grey rounded" />
        </div>
      </div>
    </div>
  );
}

export function CartAttributeList({
  condition,
  paymentMethod,
  returnPack,
}: {
  condition: string;
  paymentMethod: string;
  returnPack: string;
}) {
  const returnPackYes = returnPack === "Yes";

  return (
    <div className="flex flex-wrap gap-y-2 text-grey-dark text-sm mt-4">
      <span className="flex items-center w-1/2 grow">
        <CheckIcon />
        {condition}
      </span>
      <span className="flex items-center w-1/2 grow">
        <CheckIcon />
        {paymentMethod}
      </span>
      <span className="flex items-center w-1/2 grow">
        {returnPackYes ? <CheckIcon /> : <CrossIcon />}
        Return Pack
      </span>
    </div>
  );
}

export function DeleteIcon() {
  return (
    <svg width="19" height="21" viewBox="0 0 19 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
      <path
        d="M1 4.05C0.585786 4.05 0.25 4.38579 0.25 4.8C0.25 5.21421 0.585786 5.55 1 5.55V4.05ZM18 5.55C18.4142 5.55 18.75 5.21421 18.75 4.8C18.75 4.38579 18.4142 4.05 18 4.05V5.55ZM16.1111 4.8H16.8611C16.8611 4.38579 16.5253 4.05 16.1111 4.05V4.8ZM2.88889 18.1H2.13889H2.88889ZM4.97222 4.8C4.97222 5.21421 5.30801 5.55 5.72222 5.55C6.13644 5.55 6.47222 5.21421 6.47222 4.8H4.97222ZM7.61111 1V0.25V1ZM11.3889 1V0.25V1ZM12.5278 4.8C12.5278 5.21421 12.8636 5.55 13.2778 5.55C13.692 5.55 14.0278 5.21421 14.0278 4.8H12.5278ZM8.36111 9.55C8.36111 9.13579 8.02532 8.8 7.61111 8.8C7.1969 8.8 6.86111 9.13579 6.86111 9.55H8.36111ZM6.86111 15.25C6.86111 15.6642 7.1969 16 7.61111 16C8.02532 16 8.36111 15.6642 8.36111 15.25H6.86111ZM12.1389 9.55C12.1389 9.13579 11.8031 8.8 11.3889 8.8C10.9747 8.8 10.6389 9.13579 10.6389 9.55H12.1389ZM10.6389 15.25C10.6389 15.6642 10.9747 16 11.3889 16C11.8031 16 12.1389 15.6642 12.1389 15.25H10.6389ZM1 5.55H2.88889V4.05H1V5.55ZM2.88889 5.55H18V4.05H2.88889V5.55ZM15.3611 4.8V18.1H16.8611V4.8H15.3611ZM15.3611 18.1C15.3611 18.4064 15.2401 18.6994 15.026 18.9147L16.0898 19.9723C16.5841 19.475 16.8611 18.8014 16.8611 18.1H15.3611ZM15.026 18.9147C14.8121 19.1299 14.5228 19.25 14.2222 19.25V20.75C14.9235 20.75 15.5952 20.4697 16.0898 19.9723L15.026 18.9147ZM14.2222 19.25H4.77778V20.75H14.2222V19.25ZM4.77778 19.25C4.47715 19.25 4.18794 19.1299 3.97401 18.9147L2.91025 19.9723C3.40479 20.4697 4.07648 20.75 4.77778 20.75V19.25ZM3.97401 18.9147C3.75994 18.6994 3.63889 18.4064 3.63889 18.1H2.13889C2.13889 18.8014 2.41585 19.475 2.91025 19.9723L3.97401 18.9147ZM3.63889 18.1V4.8H2.13889V18.1H3.63889ZM2.88889 5.55H16.1111V4.05H2.88889V5.55ZM6.47222 4.8V2.9H4.97222V4.8H6.47222ZM6.47222 2.9C6.47222 2.59359 6.59327 2.3006 6.80735 2.08527L5.74358 1.02772C5.24919 1.52503 4.97222 2.19859 4.97222 2.9H6.47222ZM6.80735 2.08527C7.02127 1.87009 7.31048 1.75 7.61111 1.75L7.61111 0.25C6.90981 0.25 6.23813 0.530271 5.74358 1.02772L6.80735 2.08527ZM7.61111 1.75H11.3889V0.25H7.61111V1.75ZM11.3889 1.75C11.6895 1.75 11.9787 1.87009 12.1927 2.08527L13.2564 1.02772C12.7619 0.530271 12.0902 0.25 11.3889 0.25V1.75ZM12.1927 2.08527C12.4067 2.3006 12.5278 2.59359 12.5278 2.9H14.0278C14.0278 2.19859 13.7508 1.52503 13.2564 1.02772L12.1927 2.08527ZM12.5278 2.9V4.8H14.0278V2.9H12.5278ZM6.86111 9.55V15.25H8.36111V9.55H6.86111ZM10.6389 9.55V15.25H12.1389V9.55H10.6389Z"
        fill="currentColor"
      />
    </svg>
  );
}
